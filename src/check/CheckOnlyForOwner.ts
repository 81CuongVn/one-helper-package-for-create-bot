export const checkOnlyForOwner = (ownerArray: string[], memberId: string|undefined|null) => {
    return ownerArray.includes(String(memberId));
};
