import { useState, useCallback, useEffect, useRef } from "react";

const NiceSelect = ({options,defaultCurrent, placeholder,className,onChange,name}) => {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState(options[defaultCurrent]);
    const onClose = useCallback(() => {
        setOpen(false);
    }, []);
    const ref = useRef(null);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }

            onClose();
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown, { passive: true });

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [onClose]);

    const currentHandler = (item) => {
        setCurrent(item);
        onChange(item, name);
        onClose();
    };

    return (
        <div
            className={`nice-select ${ className, open && "open"}`}
            role="button"
            tabIndex={0}
            onClick={() => setOpen((prev) => !prev)}
            onKeyPress={(e) => e}
            ref={ref}
        >
            <span className="current">{current?.text || placeholder}</span>
            <ul
                className="list"
                role="menubar"
                onClick={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
            >
                {options?.map((item) => (
                    <li
                        key={item.value}
                        data-value={item.value}
                        className={ `option text-capitalize ${item.value === current?.value && "selected focus"}`
                        }
                        role="menuitem"
                        onClick={() => currentHandler(item)}
                        onKeyPress={(e) => e}
                    >
                        {item.text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NiceSelect;
