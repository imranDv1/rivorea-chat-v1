"use client"
import { pusherClient } from '@/lib/pusher'
import { chatHrefConstructor, toPusherKey } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'

import { FC, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import UnseenChatToast from './UnseenChatToast'
import { Check } from 'lucide-react'

interface SidebarChatListProps {
  friends: User[],
  sessionId: string
}

interface ExtendedMessage extends Message {
  senderImg: string
  senderName: string
}


const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [unseenMessages, setunseenMessages] = useState<Message[]>([])
  const [activeChats, setActiveChats] = useState<User[]>(friends)

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`))
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`))

    const newFriendHandler = ( newFriend : User) => {
    setActiveChats((prev)=> [...prev, newFriend])
    }


    const chatHandler = (message: ExtendedMessage) => {
      const shouldNotify = pathname !== `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`

      if (!shouldNotify) return

      toast.custom((t) => (
        <UnseenChatToast t={t} senderId={message.senderId} sessionId={sessionId} senderImg={message.senderImg} senderMessage={message.text} senderName={message.senderName} />
      ))

      setunseenMessages((prev)=> [...prev, message])
    }

    pusherClient.bind('new_message', chatHandler)
    pusherClient.bind('new_friend', newFriendHandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`))
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`))
      pusherClient.unbind('new_message', chatHandler)
      pusherClient.unbind('new_friend', newFriendHandler)

    }
  }, [pathname, sessionId , router])



  useEffect(() => {
    if (pathname?.includes('chat')) {
      setunseenMessages((prev) => {
        return prev.filter((msg) => !pathname.includes(msg.senderId))
      })
    }
  }, [pathname])

  return <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1  '>
    {activeChats.sort().map((friend) => {
      const unseenMessagesCount = unseenMessages.filter((unseenMsg) => {
        return unseenMsg.senderId === friend.id
      }).length

      return <li key={friend.id}>
        <a href={`/dashboard/chat/${chatHrefConstructor(sessionId, friend.id)}`}
          className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center g-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
        >{friend.name}
          {unseenMessagesCount > 0 ? (

            <div className='bg-indigo-600 font-medium text-xs ml-3 text-white w-4 h-4 rounded-full flex justify-center items-center'>{unseenMessagesCount}</div>

          ) : null}

          { friend.verified && (
            <span className="bg-blue-500 rounded-full p-[2px] ml-2">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </span>
          )}

          { friend.goldenBadge && (
            <span className="bg-amber-400 rounded-full p-[2px] ml-2">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </span>
          )}
        </a>
      </li>
    })}
  </ul>
}

export default SidebarChatList