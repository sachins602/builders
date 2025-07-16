type StreetAddressProps = {
    address: string;
};

export default function StreetAddress({ address }: StreetAddressProps) {


    const shortAddress = address.split(',').slice(0, 2).join(',').trim();

    return (
        <div className="text-sm text-gray-500">
            {shortAddress}
        </div>
    );
}