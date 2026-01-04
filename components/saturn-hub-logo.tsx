import Image from "next/image"
import { cn } from "@/lib/utils"

interface SaturnHubLogoProps {
  className?: string
  iconClassName?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "gradient"
}

const sizeMap = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
}

export function SaturnHubLogo({ 
  className, 
  iconClassName, 
  size = "md",
  variant = "default"
}: SaturnHubLogoProps) {
  const pixelSize = size === "sm" ? 48 : size === "md" ? 64 : 80
  
  return (
    <Image
      src="https://img5.pic.in.th/file/secure-sv1/Untitled-design-17.webp"
      alt="Saturn Hub Logo"
      width={pixelSize}
      height={pixelSize}
      className={cn(sizeMap[size], iconClassName, className)}
      unoptimized
    />
  )
}

