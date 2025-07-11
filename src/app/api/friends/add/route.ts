import { addFriendValidator } from "@/lib/validations/add-friend"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { fetchRedis } from "@/helpers/redis"
import { db } from "@/lib/db"
import { z } from "zod"
import { pusherServer } from "@/lib/pusher"
import { toPusherKey } from "@/lib/utils"
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const { email: emailToAdd } = addFriendValidator.parse(body.email)


        const idToAdd = await fetchRedis('get', `user:email:${emailToAdd}`) as string

        //  stopped on 2:19:06 sii you tomorrow

        if (!idToAdd) {
            return new Response("This person does not exist", { status: 400 })
        }
        const session = await getServerSession(authOptions)
        if (!session) {
            return new Response("Unauthorized", { status: 401 })
        }

        if (idToAdd === session.user.id) {
            return new Response("You cannot add yourself as a friend", { status: 400 })
        }

        // Check if the user is already a friend
        const isAlreadyAdded = await fetchRedis('sismember', `user:${idToAdd}:incoming_friend_requests`, session.user.id) as 0 | 1
        if (isAlreadyAdded) {
            return new Response("This user is already your friend", { status: 400 })
        }

        const isAlreadyFriends = await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd) as 0 | 1
        if (isAlreadyFriends) {
            return new Response("This user is already your friend", { status: 400 })
        }

        // Add friend request

        pusherServer.trigger(
            toPusherKey(`user:${idToAdd}:incoming_friend_requests`), 'incoming_friend_requests',
            {
                senderId: session.user.id,
                senderEmail: session.user.email
            }
        )

        db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id)

        return new Response("Friend request sent", { status: 200 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response("Invalid request payload", { status: 400 })
        }

        return new Response("Could not add friend, please try again later", { status: 500 })
    }
}