import { cn } from "@/lib/utils"
import { AuthContext } from "../auth/AuthProvider"
import { useContext } from "react"
import { TMessage } from "@backend/sockets/eventTypes"
import { ChatContext } from "./ChatProvider"
import Dropdown from '../ui/dropdown.tsx'

type Props = {
    message: TMessage
}

export default function ChatMessage({ message }: Props) {
    const { id, message: messageText, senderId } = message;
    const { userData } = useContext(AuthContext)
    const { getUserById, removeMessage, onEditMessageStart } = useContext(ChatContext)
    const isSentByMe = senderId === userData.id
    const sender = getUserById(senderId)

    const onRemove = () => {
        removeMessage(id);
    };

    const onEdit = () => {
        onEditMessageStart(message)
    };

    const checkIfUrl = (message: string) => {
        let url;

        try {
            url = new URL(message);
        } catch (_) {
            return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
    }

    return (
        <div
            className={cn(
                "flex flex-wrap py-1 px-4 pb-3 rounded-lg shadow-md mt-2 last-of-type:mt-5",
                isSentByMe
                    ? "self-end bg-teal-900 text-white"
                    : "self-start bg-gray-200"
            )}
        >

            <div>
                <p className="font-bold space-y-1 text-slate-400">
                    {sender.firstName} {sender.lastName}
                </p>
                <p>{checkIfUrl(messageText) ? (
                    <a href={messageText} target="_blank">{messageText}</a>
                ) : (
                    messageText
                )}</p>
            </div>
            <div className="w-1">
                <Dropdown onRemove={onRemove} onEdit={onEdit} />
            </div>


        </div>
    )
}
