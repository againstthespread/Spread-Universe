import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p 
            className="text-sm text-muted-foreground"
            data-testid="text-copyright"
          >
            © {currentYear} Against The Spread. All rights reserved.
          </p>
          
          <Link href="/admin">
            <button 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-admin-footer"
            >
              Admin Portal
            </button>
          </Link>
        </div>
      </div>
    </footer>
  );
}
