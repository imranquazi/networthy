import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="h-12 w-24 relative mb-2">
              <Image
                src="/assets/Asset 1.png"
                alt="Networthy Logo"
                fill
                className="object-contain"
                sizes="100%"
              />
            </div>
            <p className="text-muted-foreground">
              The all-in-one platform for tracking creator success across all
              platforms.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  API
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Networthy. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Discord
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
