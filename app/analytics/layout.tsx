import type React from "react"

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="-mt-24">{children}</div>
}
