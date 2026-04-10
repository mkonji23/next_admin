'use client';

interface KakaoShareParams {
    title: string;
    description: string;
    imageUrl?: string;
    buttonText?: string;
    linkUrl?: string;
    serverCallbackArgs?: {};
}
// CHAT_TYPE
// MemoChat: 나와의 채팅방
// DirectChat: 다른 사용자와의 1:1 채팅방
// MultiChat: 다른 사용자들과의 그룹 채팅방
// OpenDirectChat: 1:1 오픈채팅방
// OpenMultiChat: 그룹 오픈채팅방

const useKakaoShare = () => {
    const sendDefault = (params: KakaoShareParams) => {
        if (!window.Kakao || !window.Kakao.isInitialized()) {
            console.error('Kakao SDK not initialized');
            return;
        }

        const {
            title,
            description,
            imageUrl = 'https://ik.imagekit.io/ebas77mtp/choiMath/logo.jpg',
            buttonText = '자세히 보기',
            linkUrl = 'http://localhost:4000',
            serverCallbackArgs = {}
        } = params;
        window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: title,
                description: description,
                imageUrl: imageUrl,
                link: {
                    mobileWebUrl: linkUrl,
                    webUrl: linkUrl
                }
            },
            // 서버 콜백 설정 시 함께 전달될 파라미터
            serverCallbackArgs: serverCallbackArgs,
            buttons: [
                {
                    title: buttonText,
                    link: {
                        mobileWebUrl: linkUrl,
                        webUrl: linkUrl
                    }
                }
            ]
        });
    };

    const unLink = () => {
        // window.Kakao.API.request({
        //     url: '/v1/user/unlink'
        // })
        //     .then(function (response) {
        //         console.log(response);
        //     })
        //     .catch(function (error) {
        //         console.log(error);
        //     });

        window.Kakao.Auth.logout()
            .then(function (response) {
                console.log(window.Kakao.Auth.getAccessToken()); // null
            })
            .catch(function (error) {
                console.log('Not logged in.');
            });
    };

    return { sendDefault, unLink };
};

export default useKakaoShare;
