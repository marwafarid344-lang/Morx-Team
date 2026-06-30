import type React from "react"

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="-mt-20">{children}</div>
}
