import { TSocket, TSocketServer, userToSockerMapping } from '../socket'
import { logger } from '../../utils/logger'
import { ChatRoom } from '../../entities/ChatRoom'
import { TChatRoom, TChatRoomMinimal } from '../eventTypes'
import { User } from '../../entities/User'
import { ChatRoomUsers } from '../../entities/ChatRoomUsers'

const handleChatRoomEvents = (io: TSocketServer, socket: TSocket) => {
    socket.on('getUserChatRooms', async (token, userData, callback) => {

        const usersChatRooms = (await ChatRoom.createQueryBuilder('chatRoom')
            .innerJoin('chatRoom.chatRoomUsers', 'chatRoomUsers')
            .innerJoinAndSelect('chatRoomUsers.user', 'user')
            .where('user.id = :id', { id: userData.id })
            .getMany()) as TChatRoomMinimal[]

        logger.verbose(
            `[getUserChatRooms]: Found ${userData.firstName} to be a part of: ${usersChatRooms.length} rooms`
        )

        callback(usersChatRooms)
    })

    socket.on(
        'getChatRoom',
        async (token, userData, targetChatRoomId, callback) => {
     
            const chatRoom = await ChatRoom.createQueryBuilder('chatRoom')
                .innerJoinAndSelect('chatRoom.chatRoomUsers', 'chatRoomUsers')
                .innerJoinAndSelect('chatRoom.createdBy', 'creator')
                .innerJoinAndSelect('chatRoomUsers.user', 'user')
                .leftJoinAndSelect('chatRoom.messages', 'message')
                .leftJoinAndSelect('message.sentBy', 'sender')
                .where('chatRoom.id = :id', { id: targetChatRoomId })
                .orderBy('message.createdAt', 'DESC')
                .getOne()

            if (chatRoom) {
                const data: TChatRoom = {
                    id: chatRoom.id,
                    creatorId: chatRoom.createdBy.id,
                    name: chatRoom.name,
                    messages: chatRoom.messages.map(
                        (message) => message.publicVersion
                    ),
                    userIds: chatRoom.chatRoomUsers.map(
                        (chatRoomUser) => chatRoomUser.user.id
                    ),
                }
                logger.verbose(
                    `[getChatRoom]: Found room with id: ${targetChatRoomId} named: ${chatRoom.name}`
                )

                callback({
                    ok: true,
                    data,
                })
            } else {
                callback({
                    ok: false,
                    message: "Chat room doesn't exist",
                })
            }
        }
    )

    socket.on(
        'createChatRoom',
        async (token, userData, chatRoomName, userIds, callback) => {
  
            const chatRoomCreator = await User.findOneByOrFail({
                id: userData.id,
            })

            let newChatRoom = await ChatRoom.save({
                name: chatRoomName,
                createdBy: chatRoomCreator,
                chatRoomUsers: [],
            })

            const myUserIds = [...userIds]
            myUserIds.push(userData.id)
            myUserIds.forEach(async (userId) => {
                const userParticipant = await User.findOneByOrFail({
                    id: userId,
                })

                logger.verbose(
                    `Adding user: ${userParticipant.firstName} to chatRoom: ${newChatRoom.name}`
                )

                // connect a user with a room
                const newChatRoomUserEntry = ChatRoomUsers.create({
                    chatRoom: newChatRoom,
                    lastReadAt: new Date(),
                    user: userParticipant,
                })
                await ChatRoomUsers.save(newChatRoomUserEntry)

                // add that connection to the room so it knows what users are in it
                newChatRoom.chatRoomUsers.push(newChatRoomUserEntry)
            })

            // save all those connections to the chat room
            newChatRoom = await ChatRoom.save(newChatRoom)

            const chatRoomFrontend: TChatRoom = {
                name: newChatRoom.name,
                creatorId: newChatRoom.createdBy.id,
                id: newChatRoom.id,
                messages: [],
                userIds: myUserIds,
            }

            logger.verbose(
                `User: ${userData.firstName} is creating a chat room with: ${
                    chatRoomFrontend.userIds.length - 1
                } users`
            )

            for (const userId of chatRoomFrontend.userIds) {
                const socketId = userToSockerMapping.get(userId)
                if (!socketId) continue

                io.to(socketId).emit(
                    'chatRoomsListEvent',
                    'add',
                    chatRoomFrontend
                )
            }

            callback(chatRoomFrontend)
        }
    )
}

export default handleChatRoomEvents
