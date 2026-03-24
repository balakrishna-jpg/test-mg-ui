import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

interface Option {
    value: string;
    label: string;
}

interface SimpleSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: Option[];
    triggerClassName?: string;
    contentClassName?: string;
    itemClassName?: string;
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
    value,
    onValueChange,
    placeholder,
    options,
    triggerClassName,
    contentClassName,
    itemClassName,
}) => {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className={itemClassName}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
