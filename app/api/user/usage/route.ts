import { prisma } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'not authed' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId
            },
            select: {
                currentPlan: true,
                subscriptionStatus: true,
                meetingsThisMonth: true,
                chatMessagesToday: true,
                billingPeriodStart: true,
            }
        })

        if (!user) {
            const clerkUser = await currentUser()
            if (!clerkUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            const primaryEmail = clerkUser.emailAddresses?.find(
                (email) => email.id === clerkUser.primaryEmailAddressId
            )?.emailAddress

            const created = await prisma.user.upsert({
                where: { id: clerkUser.id },
                create: {
                    id: clerkUser.id,
                    clerkId: clerkUser.id,
                    email: primaryEmail || null,
                    name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim()
                },
                update: {
                    email: primaryEmail || null,
                    name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim()
                },
                select: {
                    currentPlan: true,
                    subscriptionStatus: true,
                    meetingsThisMonth: true,
                    chatMessagesToday: true,
                    billingPeriodStart: true,
                }
            })

            return NextResponse.json(created)
        }
        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'failed to fetch usaged' }, { status: 500 })
    }
}
