import FriendRequests from '@/components/FriendRequests'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'



const page = async () => {

    const session = await getServerSession(authOptions)
    if(!session) notFound()

        // ids of the users that have sent friend requests to this user

        const incomingSenderIds =  await fetchRedis('smembers', `user:${session.user.id}:incoming_friend_requests`) as string[]

        const incomingFrendRequests = await Promise.all(
            incomingSenderIds.map(async (senderId) => {
                const sender = await fetchRedis('get', `user:${senderId}`) as string
                const senderPased = JSON.parse(sender) as User
                return {
                    senderId,
                    senderEmail: senderPased.email,
                }
            })
        )

        // stoped on 3:31:03 

  return <main className='pt-20'>
    <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
   <div className='flex flex-col gap-4'>
    <FriendRequests  incomingFriendRequest={incomingFrendRequests} sessionId={session.user.id} />
   </div>
  </main>
}

export default page