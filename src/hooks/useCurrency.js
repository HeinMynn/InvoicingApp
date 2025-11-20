import { useStore } from '../store/useStore';

export const useCurrency = () => {
    const shopInfo = useStore((state) => state.shopInfo);
    return shopInfo.currencySymbol || shopInfo.currency || 'MMK';
};
