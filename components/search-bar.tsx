"use client"
import React, { JSX } from 'react'
import { Input } from "@/components/ui/input";

const SearchBar = ({ onSearch, icon } : { onSearch: (query: string) => void, icon: JSX.Element }) => {
    return (
        <div className="bg-background border sm:w-[600px] w-full tracking-wide font-semibold rounded-md flex gap-0.5 items-center py-1 px-3">
            {icon}
            <Input className="focus-visible:outline-none focus-visible:ring-transparent select-none shadow-none outline-none border-none" placeholder="Search for anything..." onKeyDown={
                (event: React.KeyboardEvent<HTMLInputElement>) => {
                    const target = event.currentTarget as HTMLInputElement;
                    if (event.key === "Enter") {
                        if (target.value.trim().length > 0) {
                            onSearch(target.value.trim());
                        }
                    }
                }
            } />
        </div>
    )
}

export default SearchBar