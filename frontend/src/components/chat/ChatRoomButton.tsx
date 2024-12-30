import { cn } from "@/lib/utils"
import { TChatRoomMinimal } from "@backend/sockets/eventTypes"
import { useContext } from "react"
import { Button } from "../ui/button"
import { ChatContext } from "./ChatProvider"

type Props = {
    chatRoom: TChatRoomMinimal
}

export default function ChatRoomButton({ chatRoom }: Props) {
    const { openChatRoom, currentChatRoom } = useContext(ChatContext)
    const { id, name } = chatRoom
    const selected = currentChatRoom && currentChatRoom.id === id

    return (
        <Button
            variant={"secondary"}
            className={cn(
                "flex justify-between items-center w-52 space-x-4 hover:bg-gray-500 hover:text-white",
                selected && "bg-gray-700 shadow-sm"
            )}
            onClick={() => openChatRoom(id)}
        >
            <p className={cn(selected && "text-white")}>{name}</p>
        </Button>
    )
}
