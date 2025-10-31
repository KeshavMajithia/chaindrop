"use client"

export function Footer() {
  return (
    <footer className="glass border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">ChainDrop</h3>
            <p className="text-sm text-muted-foreground">Secure blockchain-based file transfer on Sui network</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Security
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Blog
                </button>
              </li>
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Contact
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Privacy
                </button>
              </li>
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Terms
                </button>
              </li>
              <li>
                <button onClick={() => {}} className="hover:text-foreground transition-colors">
                  Security
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2025 ChainDrop. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => {}} className="text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </button>
            <button onClick={() => {}} className="text-muted-foreground hover:text-foreground transition-colors">
              Discord
            </button>
            <button onClick={() => {}} className="text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
