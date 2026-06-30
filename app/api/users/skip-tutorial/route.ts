import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { auth_user_id } = body

    if (!auth_user_id) {
      return NextResponse.json(
        { success: false, error: "Missing auth_user_id" },
        { status: 400 }
      )
    }

    // Update the user's skip_tutorial to true
    const { data, error } = await supabase
      .from("users")
      .update({ skip_tutorial: true })
      .eq("auth_user_id", auth_user_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating skip_tutorial:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Tutorial skipped successfully"
    })
  } catch (error) {
    console.error("Error in skip-tutorial API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
