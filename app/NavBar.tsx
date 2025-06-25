import Link from 'next/link'
import React from 'react'
import { MdDocumentScanner } from "react-icons/md";

const NavBar = () => {
    const links =[
        {lable:"Home",href:"/"},
        {lable:"About",href:"/about" }
    ]
  return (
    <div>
    <nav className='flex space-x-6 border-b p-4 mb-5 text-zinc-500 hover:text-slate-900 cursor-pointer transition items-center'>
        <Link href="/"><MdDocumentScanner /></Link>
        <ul className='flex space-x-6 items-center'>
            {links.map((link)=><li key={link.href} className=' text-zinc-500 hover:text-slate-900 cursor-pointer transition'>{link.lable}</li>)}
        </ul>
    </nav>
    </div>
  )
}

export default NavBar
