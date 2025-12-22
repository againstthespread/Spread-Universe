import { Link } from "wouter";
import BasketballIcon from "@/components/ui/basketball-icon";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <BasketballIcon className="text-accent text-xl mr-2" />
              <span className="font-inter font-bold text-lg">NCAA Pick'Em</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">© {new Date().getFullYear()} NCAA Pick'Em. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <Link href="/rules" className="hover:text-accent">
              Rules
            </Link>
            <Link href="/faq" className="hover:text-accent">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-accent">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-accent">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
