import { useEffect, useState } from "react";
import alfamart from "../alfamart.json";
import indomaret from "../indomaret.json";

export const useLocations = () => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const combined = [
            ...alfamart.map(item => ({ ...item, type: 'Alfamart' })),
            ...indomaret.map(item => ({ ...item, type: 'Indomaret' }))
        ];

        setLocations(combined);
    }, []);

    return locations;
};