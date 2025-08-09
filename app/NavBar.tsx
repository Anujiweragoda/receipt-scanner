'use client'; // This is necessary for using hooks like usePathname

import Link from 'next/link';
import React from 'react';
import { MdDocumentScanner } from 'react-icons/md'; // Assuming you have react-icons installed
import { usePathname } from 'next/navigation';
import classnames from 'classnames'; // For conditional class application

const NavBar = () => {
  const currentPath = usePathname();

  const links = [
    { label: 'Receipt Scanner', href: '/receipt' }, // Use descriptive labels
    { label: 'Finance Tracker', href: '/financeTracker' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-500 to-green-600 shadow-lg">
      {/* Brand/Logo Section */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="text-white text-3xl hover:text-gray-100 transition-colors duration-300">
          <MdDocumentScanner />
        </Link>
        <Link href="/" className="text-white text-xl font-bold tracking-wide hover:text-gray-100 transition-colors duration-300 hidden md:block">
          My Finance App
        </Link>
      </div>

      {/* Navigation Links */}
      <ul className="flex space-x-6 items-center">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={classnames(
              'text-lg font-medium transition-colors duration-300',
              {
                'text-white cursor-default': link.href === currentPath, // Active link is white, no hover effect
                'text-teal-100 hover:text-white': link.href !== currentPath, // Inactive links are lighter, turn white on hover
              }
            )}
          >
            {link.label}
          </Link>
        ))}
      </ul>
    </nav>
  );
};

export default NavBar;