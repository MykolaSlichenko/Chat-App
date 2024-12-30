import {
    PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import { AuthContext } from "../auth/AuthProvider"

import { useMap, useEffectOnce } from "usehooks-ts"
import { socket } from "@/socket"
import {
    TChatRoom,
    TChatRoomMinimal,
    TChatRoomsListEventType,
    TMessage,
    TUserMinimal,
    TUsersListEventType,
} from "@backend/sockets/eventTypes"
import { useToast } from "../ui/use-toast"

type TChatContext = {
    chatRooms: TChatRoomMinimal[]
    currentChatRoom: TChatRoom | null
    openChatRoom: (id: number) => void
    users: TUserMinimal[]
    getUserById: (id: number) => TUserMinimal
    createChatRoom: (chatRoomName: string, userIds: number[]) => void
    getOtherUsers: () => TUserMinimal[]
    sendMessage: (message: string) => void
    removeMessage: (messageId: number) => void
    onEditMessageStart: (message: TMessage) => void
    handleSendEditedMessage: (id: number, message: string) => void
    messageToEdit: TMessage | null
}

export type TChatUser = {
    id: number
    firstName: string
    lastName: string
    isOnline: boolean
}

export const ChatContext = createContext<TChatContext>(null!)

export const ChatProvider = ({ children }: PropsWithChildren) => {
    const { userData, token } = useContext(AuthContext)
    const [currentChatRoom, setCurrentChatRoom] = useState<TChatRoom | null>(null)

    // all users chat rooms
    const [chatRooms, setChatRooms] = useState<TChatRoomMinimal[]>([])

    // all users
    const [usersMap, usersActions] = useMap<number, TUserMinimal>()

    // Inital socket connection & handle disconnect
    useEffectOnce(() => {
        socket.connect()

        return () => {
            socket.disconnect()
        }
    })

    // Send inital credentials
    useEffectOnce(() => {
        socket.emit("newConnection", token, userData)

        socket.emit("getUserChatRooms", token, userData, setChatRooms)

        socket.emit("getUsers", token, userData, (res) => {
            if (res.ok) {
                res.data.forEach((user) => {
                    usersActions.set(user.id, user)
                })
            } else {
                console.error(res.message)
            }
        })
    })

    const [messageToEdit, setMessageToEdit] = useState<TMessage | null>(null);

    function onEditMessageStart(message: TMessage) {
        setMessageToEdit(message);
    }

    // Register event handlers
    useEffect(() => {
        function onUsersListUpdate(
            type: TUsersListEventType,
            newUsers: TUserMinimal[]
        ) {
            newUsers.forEach((user) => {
                if (type === "update") {
                    usersActions.set(user.id, user)
                } else if (type === "remove") {
                    usersActions.remove(user.id)
                } else {
                    console.error("Unhandled usersListUpdate type:", type)
                }
            })
        }

        function onServerMessage(newMessage: TMessage, targetChatRoomId: number) {
            console.log(
                "new message from server",
                newMessage,
                "to room id:",
                targetChatRoomId
            )

            if (!currentChatRoom || targetChatRoomId !== currentChatRoom.id) {
                console.log("got message in an not open room")
                return
            }

            setCurrentChatRoom((chatRoom) => {
                if (!chatRoom) return null

                chatRoom.messages.unshift(newMessage)

                const newChatRoom = {
                    ...chatRoom,
                }

                return newChatRoom
            })
        }

        function onRemoveServerMessage(messageId: number, targetChatRoomId: number) {
            console.log('onRemoveMessageServer', messageId, targetChatRoomId)

            if (!currentChatRoom || targetChatRoomId !== currentChatRoom.id) {
                console.log("got remove message in an not open room")
                return
            }

            setCurrentChatRoom((chatRoom) => {
                if (!chatRoom) return null

                chatRoom.messages = chatRoom.messages.filter(message => message.id !== messageId);

                const newChatRoom = {
                    ...chatRoom,
                }

                return newChatRoom
            })
        }

        function onEditServerMessage(updatedMessage: TMessage, targetChatRoomId: number) {
            const { id, message } = updatedMessage;

            if (!currentChatRoom || targetChatRoomId !== currentChatRoom.id) {
                console.log("Editing message in a room that is not open");
                return;
            }

            setCurrentChatRoom((chatRoom) => {
                if (!chatRoom) return null;

                const updatedMessages = chatRoom.messages.map((msg) =>
                    msg.id === id ? { ...msg, message } : msg
                );
                return {
                    ...chatRoom,
                    messages: updatedMessages,
                };
            });
        }

        function onChatRoomsListEvent(
            type: TChatRoomsListEventType,
            newChatRoom: TChatRoom
        ) {
            if (type === "add") {
                console.log("Adding new chat room", newChatRoom)
                setChatRooms((chatRooms) => [...chatRooms, newChatRoom])
            } else if (type === "remove") {
                throw new Error("NOT IMPLEMENTED")
            } else {
                console.error("Unhandled chatRoomsListEvent type:", type)
            }
        }

        socket.on("usersListEvent", onUsersListUpdate)
        socket.on("serverMessage", onServerMessage)
        socket.on("removeClientMessage", onRemoveServerMessage)
        socket.on("serverEditedMessage", onEditServerMessage)
        socket.on("chatRoomsListEvent", onChatRoomsListEvent)

        return () => {
            socket.off("usersListEvent", onUsersListUpdate)
            socket.off("serverMessage", onServerMessage)
            socket.off("removeClientMessage", onRemoveServerMessage)
            socket.off("serverEditedMessage", onEditServerMessage)
            socket.off("chatRoomsListEvent", onChatRoomsListEvent)
        }
    }, [currentChatRoom, usersActions])

    function sendMessage(message: string) {
        if (message.length === 0 || currentChatRoom === null) return
        if (!currentChatRoom) return;

        console.log(
            `sending message: ${message} to target room with id: ${currentChatRoom.id}`
        )

        socket.emit("clientMessage", token, userData, message, currentChatRoom.id)

    }

    function removeMessage(id: number) {
        if (!currentChatRoom) return;
        console.log('socket.emit remove message', id);
        socket.emit("removeClientMessage", token, userData, id, currentChatRoom.id)
    }

    function handleSendEditedMessage(messageId: number, updatedMessage: string) {
        if (!messageToEdit || !currentChatRoom) return;
        console.log('handleSendEditedMessage: ', messageId, updatedMessage);
        if (!currentChatRoom) return;

        console.log(`Editing message with id ${messageId} to: ${updatedMessage}`);
        socket.emit("editClientMessage", token, userData, messageId, updatedMessage, currentChatRoom.id);
        setMessageToEdit(null);
    }

    function createChatRoom(chatRoomName: string, userIds: number[]) {
        if (chatRoomName.length === 0 || userIds.length === 0) return

        socket.emit(
            "createChatRoom",
            token,
            userData,
            chatRoomName,
            userIds,
            (newChatRoom) => {
                setCurrentChatRoom(newChatRoom)
            }
        )
    }

    function openChatRoom(id: number) {
        if (id < 0) {
            setCurrentChatRoom(null)
            return
        }

        socket.emit("getChatRoom", token, userData, id, (res) => {
            if (res.ok) {
                setCurrentChatRoom(res.data)
                console.log("current open chat room", res.data)
            } else {
                setCurrentChatRoom(null)
                console.error(res.message)
            }
        })
    }

    /**
     * Returns all users that are not the current user
     */
    function getOtherUsers(): TUserMinimal[] {
        return Array.from(usersMap.values()).filter(
            (user) => user.id !== userData.id
        )
    }

    function getUserById(id: number): TUserMinimal {
        const targetUser = usersMap.get(id)
        if (!targetUser) {
            throw new Error(`looking for user id: ${id}, wasn't able to find him`)
        }
        return targetUser
    }

    const value: TChatContext = {
        openChatRoom,
        chatRooms,
        currentChatRoom,
        users: Array.from(usersMap.values()),
        getUserById,
        sendMessage,
        removeMessage,
        onEditMessageStart,
        handleSendEditedMessage,
        messageToEdit,
        createChatRoom,
        getOtherUsers,
    }

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
