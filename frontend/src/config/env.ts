export const getApiUrl = (): string => {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:5001/api`;
    }
    return `${window.location.origin}/api`;
};

export const API_URL = getApiUrl();