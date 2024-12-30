import React, { useEffect, useState, useRef } from 'react';

function useClickOutside(ref: React.RefObject<HTMLElement>, onClickOutside: () => void) {
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClickOutside();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, onClickOutside]);
}

type DropdownProps = {
    onEdit: () => void
    onRemove: () => void
}

const Dropdown = ({ onEdit, onRemove }: DropdownProps) => {
    const wrapperRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    useClickOutside(wrapperRef, () => {
        setIsOpen(false);
    });

    const handleEdit = () => {
        onEdit();
        setIsOpen(false);
    };

    const handleRemove = () => {
        onRemove();
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative inline-block text-left">
            <div>
                <button
                    onClick={toggleDropdown}
                    className="px-4 py-2 pr-0
              text-sm font-medium text-white-700
              focus:outline-none rotate-90"
                >
                    ...
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute right-5 bottom-0 z-19 mt-2 w-46 origin-top-right w-17 
                  rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5
                  focus:outline-none"
                    role="menu"
                >
                    <div className="py-1" role="none">
                        <div
                            onClick={handleEdit}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            role="menuitem"
                        >
                            Edit
                        </div>
                        <div
                            onClick={handleRemove}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            role="menuitem"
                        >
                            Delete
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;