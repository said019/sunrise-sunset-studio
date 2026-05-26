import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByISO } from '@/lib/country-codes';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
    /** ISO 3166-1 alpha-2 of the selected country (e.g. "MX"). */
    countryISO: string;
    /** National part of the phone — digits only, no dial code. */
    phoneNational: string;
    onCountryChange: (iso: string) => void;
    onPhoneChange: (national: string) => void;

    id?: string;
    disabled?: boolean;
    placeholder?: string;
    /** Optional element absolutely-positioned inside the input wrapper (e.g. an icon). */
    inputAdornment?: ReactNode;

    triggerClassName?: string;
    inputClassName?: string;
    inputWrapperClassName?: string;
}

/**
 * Controlled phone-input combo: a country dial-code Select + a digits-only Input.
 * Combine `dialCode + phoneNational` to get the E.164 phone (parent does this).
 *
 * The component is purely controlled: it never owns state. Plug into any form
 * library (react-hook-form's setValue/watch, useState, etc.).
 */
export function PhoneInput({
    countryISO,
    phoneNational,
    onCountryChange,
    onPhoneChange,
    id = 'phone',
    disabled,
    placeholder = 'Número (solo dígitos)',
    inputAdornment,
    triggerClassName,
    inputClassName,
    inputWrapperClassName,
}: PhoneInputProps) {
    const country = findCountryByISO(countryISO) ?? DEFAULT_COUNTRY;
    return (
        <div className="flex gap-2">
            <Select value={country.iso} onValueChange={onCountryChange} disabled={disabled}>
                <SelectTrigger
                    aria-label="Código de país"
                    className={cn('h-10 w-[112px] shrink-0', triggerClassName)}
                >
                    <SelectValue>
                        <span className="mr-1">{country.flag}</span>
                        <span>{country.dialCode}</span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {COUNTRIES.map((c) => (
                        <SelectItem key={c.iso} value={c.iso}>
                            <span className="mr-2">{c.flag}</span>
                            {c.name}
                            <span className="ml-2 text-muted-foreground">{c.dialCode}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className={cn('relative flex-1', inputWrapperClassName)}>
                {inputAdornment}
                <Input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={placeholder}
                    className={inputClassName}
                    value={phoneNational}
                    onChange={(e) => onPhoneChange(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
