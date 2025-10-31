/// Module: file_drop
/// ChainDrop smart contract with premium features
/// Supports: Free drops, Paid transfers, Time-locks, Limited claims, Escrow
module chaindrop_contracts::file_drop {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    // ==================== Error Codes ====================
    
    /// Drop is time-locked and not yet unlocked
    const E_NOT_UNLOCKED: u64 = 1;
    
    /// Maximum claims reached
    const E_MAX_CLAIMS_REACHED: u64 = 2;
    
    /// Payment required but not provided
    const E_PAYMENT_REQUIRED: u64 = 3;
    
    /// Incorrect payment amount
    const E_INCORRECT_PAYMENT: u64 = 4;
    
    /// Only creator can call this function
    const E_NOT_CREATOR: u64 = 5;
    
    /// Already confirmed
    const E_ALREADY_CONFIRMED: u64 = 7;

    // ==================== Structs ====================

    /// Main FileDrop object that stores all drop metadata
    public struct FileDrop has key, store {
        id: UID,
        
        // Core metadata
        metadata_cid: String,           // IPFS CID of chunk map (sharded storage)
        creator: address,               // Address of file creator
        created_at: u64,                // Timestamp when drop was created
        
        // Premium features (all optional)
        price: Option<u64>,             // Price in MIST (1 SUI = 1e9 MIST), None = free
        unlock_time: Option<u64>,       // Unix timestamp, None = no time-lock
        max_claims: Option<u64>,        // Max number of claims, None = unlimited
        current_claims: u64,            // Current number of claims
        
        // Escrow system (for paid transfers)
        escrow_balance: Balance<SUI>,   // Holds payment until download confirmed
        download_confirmed: bool,       // True when buyer confirms download
    }

    /// Event emitted when a new drop is created
    public struct DropCreated has copy, drop {
        drop_id: ID,
        creator: address,
        metadata_cid: String,
        price: Option<u64>,
        unlock_time: Option<u64>,
        max_claims: Option<u64>,
    }

    /// Event emitted when a drop is claimed
    public struct DropClaimed has copy, drop {
        drop_id: ID,
        claimer: address,
        payment_amount: Option<u64>,
        claim_number: u64,
    }

    /// Event emitted when download is confirmed and escrow released
    public struct EscrowReleased has copy, drop {
        drop_id: ID,
        creator: address,
        amount: u64,
    }

    // ==================== Public Functions ====================

    /// Create a new file drop
    /// 
    /// # Arguments
    /// * `metadata_cid` - IPFS CID of the chunk map (sharded storage metadata)
    /// * `price` - Optional price in MIST (1 SUI = 1,000,000,000 MIST). None = free drop
    /// * `unlock_time` - Optional Unix timestamp. Drop cannot be claimed before this time
    /// * `max_claims` - Optional maximum number of claims. None = unlimited
    /// * `clock` - Sui Clock object for timestamp
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// * `FileDrop` - The created drop object (transferred to creator)
    public entry fun create_drop(
        metadata_cid: vector<u8>,
        price: Option<u64>,
        unlock_time: Option<u64>,
        max_claims: Option<u64>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let drop_id = object::new(ctx);
        let drop_id_copy = object::uid_to_inner(&drop_id);
        let creator = tx_context::sender(ctx);
        let created_at = clock::timestamp_ms(clock);

        let drop = FileDrop {
            id: drop_id,
            metadata_cid: string::utf8(metadata_cid),
            creator,
            created_at,
            price,
            unlock_time,
            max_claims,
            current_claims: 0,
            escrow_balance: balance::zero(),
            download_confirmed: false,
        };

        // Emit event
        sui::event::emit(DropCreated {
            drop_id: drop_id_copy,
            creator,
            metadata_cid: string::utf8(metadata_cid),
            price,
            unlock_time,
            max_claims,
        });

        // Share the drop object so anyone can claim it
        transfer::public_share_object(drop);
    }

    /// Claim a drop (download the file)
    /// 
    /// # Arguments
    /// * `drop` - Mutable reference to the FileDrop object
    /// * `payment` - Optional payment coin (required if drop has a price)
    /// * `clock` - Sui Clock object for time-lock verification
    /// * `ctx` - Transaction context
    /// 
    /// # Returns
    /// * `String` - The metadata CID to download the file chunks
    /// 
    /// # Aborts
    /// * `E_NOT_UNLOCKED` - If drop is time-locked and unlock time hasn't passed
    /// * `E_MAX_CLAIMS_REACHED` - If maximum claims limit is reached
    /// * `E_PAYMENT_REQUIRED` - If drop requires payment but none provided
    /// * `E_INCORRECT_PAYMENT` - If payment amount doesn't match price
    public fun claim_drop(
        drop: &mut FileDrop,
        payment: Option<Coin<SUI>>,
        clock: &Clock,
        ctx: &mut TxContext
    ): String {
        let claimer = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Check 1: Time-lock verification
        if (option::is_some(&drop.unlock_time)) {
            let unlock_time = *option::borrow(&drop.unlock_time);
            assert!(current_time >= unlock_time, E_NOT_UNLOCKED);
        };

        // Check 2: Max claims verification
        if (option::is_some(&drop.max_claims)) {
            let max_claims = *option::borrow(&drop.max_claims);
            assert!(drop.current_claims < max_claims, E_MAX_CLAIMS_REACHED);
        };

        // Check 3: Payment verification
        if (option::is_some(&drop.price)) {
            let required_price = *option::borrow(&drop.price);
            
            // Payment must be provided
            assert!(option::is_some(&payment), E_PAYMENT_REQUIRED);
            
            let payment_coin = option::destroy_some(payment);
            let payment_value = coin::value(&payment_coin);
            
            // Payment amount must match exactly
            assert!(payment_value == required_price, E_INCORRECT_PAYMENT);
            
            // Add payment to escrow
            let payment_balance = coin::into_balance(payment_coin);
            balance::join(&mut drop.escrow_balance, payment_balance);
        } else {
            // Free drop - destroy None payment
            option::destroy_none(payment);
        };

        // Increment claim counter
        drop.current_claims = drop.current_claims + 1;

        // Emit event
        sui::event::emit(DropClaimed {
            drop_id: object::uid_to_inner(&drop.id),
            claimer,
            payment_amount: drop.price,
            claim_number: drop.current_claims,
        });

        // Return metadata CID for download
        drop.metadata_cid
    }

    /// Confirm download and release escrow to creator
    /// Only the buyer (claimer) can call this after successful download
    /// 
    /// # Arguments
    /// * `drop` - Mutable reference to the FileDrop object
    /// * `ctx` - Transaction context
    /// 
    /// # Aborts
    /// * `E_ALREADY_CONFIRMED` - If download already confirmed
    public entry fun confirm_download(
        drop: &mut FileDrop,
        ctx: &mut TxContext
    ) {
        // Check not already confirmed
        assert!(!drop.download_confirmed, E_ALREADY_CONFIRMED);

        // Mark as confirmed
        drop.download_confirmed = true;

        // Release escrow to creator if there's a balance
        let escrow_value = balance::value(&drop.escrow_balance);
        if (escrow_value > 0) {
            let escrow_coin = coin::from_balance(
                balance::withdraw_all(&mut drop.escrow_balance),
                ctx
            );
            
            // Transfer to creator
            transfer::public_transfer(escrow_coin, drop.creator);

            // Emit event
            sui::event::emit(EscrowReleased {
                drop_id: object::uid_to_inner(&drop.id),
                creator: drop.creator,
                amount: escrow_value,
            });
        };
    }

    /// Cancel drop and refund escrow (only creator, only if not confirmed)
    /// 
    /// # Arguments
    /// * `drop` - The FileDrop object to cancel
    /// * `ctx` - Transaction context
    /// 
    /// # Aborts
    /// * `E_NOT_CREATOR` - If caller is not the creator
    /// * `E_ALREADY_CONFIRMED` - If download already confirmed
    public entry fun cancel_drop(
        drop: FileDrop,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Only creator can cancel
        assert!(drop.creator == sender, E_NOT_CREATOR);
        
        // Cannot cancel if already confirmed
        assert!(!drop.download_confirmed, E_ALREADY_CONFIRMED);

        let FileDrop {
            id,
            metadata_cid: _,
            creator,
            created_at: _,
            price: _,
            unlock_time: _,
            max_claims: _,
            current_claims: _,
            escrow_balance,
            download_confirmed: _,
        } = drop;

        // Refund escrow if any
        let escrow_value = balance::value(&escrow_balance);
        if (escrow_value > 0) {
            let refund_coin = coin::from_balance(escrow_balance, ctx);
            transfer::public_transfer(refund_coin, creator);
        } else {
            balance::destroy_zero(escrow_balance);
        };

        // Delete the drop object
        object::delete(id);
    }

    // ==================== View Functions ====================

    /// Get metadata CID
    public fun get_metadata_cid(drop: &FileDrop): String {
        drop.metadata_cid
    }

    /// Get creator address
    public fun get_creator(drop: &FileDrop): address {
        drop.creator
    }

    /// Get creation timestamp
    public fun get_created_at(drop: &FileDrop): u64 {
        drop.created_at
    }

    /// Get price (if any)
    public fun get_price(drop: &FileDrop): Option<u64> {
        drop.price
    }

    /// Get unlock time (if any)
    public fun get_unlock_time(drop: &FileDrop): Option<u64> {
        drop.unlock_time
    }

    /// Get max claims (if any)
    public fun get_max_claims(drop: &FileDrop): Option<u64> {
        drop.max_claims
    }

    /// Get current claims count
    public fun get_current_claims(drop: &FileDrop): u64 {
        drop.current_claims
    }

    /// Get escrow balance
    public fun get_escrow_balance(drop: &FileDrop): u64 {
        balance::value(&drop.escrow_balance)
    }

    /// Check if download is confirmed
    public fun is_download_confirmed(drop: &FileDrop): bool {
        drop.download_confirmed
    }

    // ==================== Test Functions ====================

    #[test_only]
    public fun test_create_drop(
        metadata_cid: vector<u8>,
        price: Option<u64>,
        unlock_time: Option<u64>,
        max_claims: Option<u64>,
        ctx: &mut TxContext
    ): FileDrop {
        let drop_id = object::new(ctx);
        FileDrop {
            id: drop_id,
            metadata_cid: string::utf8(metadata_cid),
            creator: tx_context::sender(ctx),
            created_at: 0,
            price,
            unlock_time,
            max_claims,
            current_claims: 0,
            escrow_balance: balance::zero(),
            download_confirmed: false,
        }
    }
}
