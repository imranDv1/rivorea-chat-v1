import { fetchRedis } from "@/helpers/redis"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Message, messageValidator } from "@/lib/validations/message"
import { getServerSession } from "next-auth"
import { nanoid } from 'nanoid'
import { pusherServer } from "@/lib/pusher"
import { toPusherKey } from "@/lib/utils"
export async function POST(req: Request) {
    try {
        const { text, chatId }: { text: string, chatId: string } = await req.json()
        const session = await getServerSession(authOptions)

        if (!session) return new Response('Unauthorized', { status: 401 })
        const [userId1, userId2] = chatId.split('--')
        if (session.user.id !== userId1 && session.user.id !== userId2) {
            return new Response('Unauthorized', { status: 401 })
        }

        const friendId = session.user.id === userId1 ? userId2 : userId1

        const friendList = await fetchRedis('smembers', `user:${session.user.id}:friends`) as string[]

        const isFriend = friendList.includes(friendId)
        if (!isFriend) {
            return new Response('Unauthorized', { status: 401 })
        }

        const rowSender = await fetchRedis('get', `user:${session.user.id}`) as string
        const sender = JSON.parse(rowSender) as User
        const timestamp = Date.now()

        const messageData: Message = {
            id: nanoid(),
            senderId: session.user.id,
            text,
            timestamp,
        }

        const message = messageValidator.parse(messageData)



        pusherServer.trigger(toPusherKey(`chat:${chatId}`), 'incoming-message', message)


        pusherServer.trigger(toPusherKey(`user:${friendId}:chats`), 'new_message', {
            ...message,
            senderImg : sender.image,
            senderName: sender.name
        })

        await db.zadd(`chat:${chatId}:messages`, {
            score: timestamp,
            member: JSON.stringify(message)
        })


        return new Response('OK')

    } catch (error) {
        if (error instanceof Error) {
            return new Response(error.message, { status: 500 })
        }

        return new Response('Internal Server Error', { status: 500 })
    }
}