'use client';

interface KakaoShareParams {
    title: string;
    description: string;
    imageUrl?: string;
    buttonText?: string;
    linkUrl?: string;
}

const useKakaoShare = () => {
    const shareDefault = (params: KakaoShareParams) => {
        if (!window.Kakao || !window.Kakao.isInitialized()) {
            console.error('Kakao SDK not initialized');
            return;
        }

        const {
            title,
            description,
            imageUrl = 'https://ik.imagekit.io/ebas77mtp/choiMath/logo.jpg',
            buttonText = '자세히 보기',
            linkUrl = 'http://localhost:4000'
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

    return { shareDefault, unLink };
};

export default useKakaoShare;
