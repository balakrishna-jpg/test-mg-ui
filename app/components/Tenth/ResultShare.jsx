import React, { useState, memo } from 'react';
import { Copy } from "lucide-react";
import { Button } from "../ui/button";


import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";

import { Label } from "../ui/label" // relative path
import { Input } from "../ui/input"


import whatsappSvg from '../../assets/whatsapp.svg';

 import share from '../../assets/share.jpg'
 import shareicon from  '../../assets/shareicon.jpg'
 import newshare from  '../../assets/newshare.png'

async function copyTextToClipboard(text) {
    if ('clipboard' in navigator) {
        return await navigator.clipboard.writeText(text);
    } else {
        return document.execCommand('copy', true, text);
    }
}

const ResultShare = ({url,img}) => {
    const [copyText, setCopyText] = useState(`${url}`)
    const [isClicked, setIsClicked] = useState(false)
    const handleClick = () => {
        if (navigator?.share) {
            navigator.share({
                title: "Aadhan News App",
                url: `${copyText}`,
            }).then(() => console.log("share response happened"))
                .catch((err) => console.log("share error happened", err))
        }
        else if (window?.AndroidShareHandler?.share) {
            // Fallback to AndroidShareHandler if navigator.share is not available
            window.AndroidShareHandler.share(`${copyText}`);
        }
        else {
            console.log("")
        }
    }
    return (
        <Dialog className="rounded-md">
            <DialogTrigger asChild>
            <img
  src={newshare}
  alt="Share Icon"
  style={{ width: "35px", height: "35px", cursor: "pointer" }}
/>





            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                    <DialogTitle>
                        <img src={img} className='w-[100%] h-[100%] pt-[2rem] mx-auto rounded-lg' alt='preview' />
                    </DialogTitle>
                    {/* <DialogDescription className='text-[15px] text-center text-black font-medium'>
                        Aadhan Election Results
                    </DialogDescription> */}
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={copyText}
                            readOnly
                        />
                    </div>
                    <button onClick={handleClick}><img src={whatsappSvg} className='w-8' alt='whatsapp' /></button>
                    <Button type="submit" size="sm" className="px-3">
                        <span className="sr-only">Copy</span>
                        <Copy className={`h-4 w-4 ${isClicked && 'scale-[0.8]'}`} onClick={() => { copyTextToClipboard(copyText); setIsClicked(true); setTimeout(() => setIsClicked(false), 100) }} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default memo(ResultShare)
