import { SendIcon } from "lucide-react"
import { KeyboardEvent, Ref, forwardRef, useContext, useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ChatContext } from "./ChatProvider"

const InputBar = forwardRef((_, ref: Ref<HTMLInputElement>) => {
    const [message, setMessage] = useState<string>("")
    const { sendMessage, messageToEdit, handleSendEditedMessage } = useContext(ChatContext)
    const [file, setFile] = useState<File | null>(null);
    const uploarInputRef = useRef<HTMLInputElement | null>(null);

    function handleSendMessage() {
        sendMessage(message)
        setMessage("")
    }

    type UploadResponse = {
        fileUrl: string;
    };

    const handleUpload = async () => {
        if (file) {
            console.log('Uploading file...');
            const formData = new FormData();
            formData.append('file', file);
            try {
                const result = await fetch('http://localhost:4000/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = (await result.json()) as UploadResponse;
                sendMessage(data.fileUrl)
                console.log(data);
            } catch (error) {
                console.error(error);
            }
        }
    };

    async function handleSubmit() {
        if (messageToEdit?.id) {
            handleSendEditedMessage(messageToEdit.id, message);
            setMessage("")
        } else {
            if (file) {
                await handleUpload();
                if (uploarInputRef?.current?.value) {
                    uploarInputRef.current.value = '';
                    setFile(null)
                }
            } else {
                handleSendMessage();
            }
        }
    }

    useEffect(() => {
        if (messageToEdit?.id) {
            setMessage(messageToEdit.message);
        }
    }, [messageToEdit]);

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.code === "Enter") {
            handleSendMessage()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };


    return (
        <div className="flex space-x-4 mr-4">
            <Input
                ref={ref}
                className="flex-1"
                placeholder="type text here..."
                onKeyDown={(e) => handleKeyDown(e)}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
            />
            <input ref={uploarInputRef} type="file" onChange={handleFileChange} />
            <Button className="px-12" onClick={handleSubmit}>
                Send <SendIcon className="h-4 w-4 ml-4 " />
            </Button>
        </div>
    )
})

export default InputBar
