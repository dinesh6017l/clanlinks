import type { Metadata } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";
const lilita=Lilita_One({subsets:["latin"],weight:"400",variable:"--font-lilita",display:"swap"});
const nunito=Nunito({subsets:["latin"],variable:"--font-nunito",display:"swap"});
export const metadata:Metadata={title:"ClanLinks · Your clan’s shared wall",description:"A home for the layouts, invites, and ideas your clan shares."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${lilita.variable} ${nunito.variable}`}>{children}</body></html>}
