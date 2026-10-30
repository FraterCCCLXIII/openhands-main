/* Mobile — a Canvas App that is a product page for the OpenHands mobile app.
 *
 * Everything on the page is taken from the openhands-mobile repository (its
 * README, app.json, eas.json, package.json and ios/). There are no store
 * badges, ratings or download counts because none exist: no prebuilt app,
 * tag or release is published, so "Download" links to the source repository
 * and the page shows the documented build-from-source commands. The phone
 * pictures are drawn with CSS and labelled as illustrations; the repository
 * has no screenshots. The only embedded image is the OpenHands logo
 * (public/favicon.svg, inlined as an SVG data URL).
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.mb`. Text is
 * always set with textContent; icons are SVG data-URL masks. No network
 * resources are loaded. Motion (reveal, float, parallax) is skipped under
 * prefers-reduced-motion and when IntersectionObserver is missing.
 */

export const PAIR_ROUTE = "/settings/mobile";
export const SETUP_ROUTE = "/settings/app";
export const REPO_NAME = "OpenHands/openhands-mobile";
export const REPO_URL = "https://github.com/OpenHands/openhands-mobile";
export const CLONE_COMMAND = "git clone https://github.com/OpenHands/openhands-mobile.git\ncd openhands-mobile\nnpm install";

const LOGO_URL = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4gPHN2ZyBpZD0iQXBwX0ljb25fU2hhcGUiIGRhdGEtbmFtZT0iQXBwIEljb24gU2hhcGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPiA8ZGVmcz4gPHN0eWxlPiAuY2xzLTEgeyBmaWxsOiB1cmwoI2xpbmVhci1ncmFkaWVudCk7IH0gLmNscy0yIHsgZmlsbDogI2ZmZjsgfSA8L3N0eWxlPiA8bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudCIgeDE9IjUxMiIgeTE9IjQ2NC43NyIgeDI9IjUxMiIgeTI9Ii0xMTA5LjgzIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+IDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzAwMCIvPiA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYiLz4gPC9saW5lYXJHcmFkaWVudD4gPC9kZWZzPiA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMDI0LDY1MWMwLDE0LjI0LDAsMjguNDgtLjA4LDQyLjczLS4wNywxMi0uMjEsMjMuOTktLjUzLDM1Ljk4LS43MSwyNi4xMy0yLjI1LDUyLjQ5LTYuODksNzguMzQtNC43MSwyNi4yMi0xMi40LDUwLjYyLTI0LjUzLDc0LjQ0LTExLjkyLDIzLjQxLTI3LjQ5LDQ0Ljg0LTQ2LjA3LDYzLjQxLTE4LjU4LDE4LjU4LTQwLDM0LjE1LTYzLjQxLDQ2LjA3LTIzLjgyLDEyLjEyLTQ4LjIyLDE5LjgyLTc0LjQ0LDI0LjUzLTI1Ljg0LDQuNjUtNTIuMiw2LjE4LTc4LjM0LDYuODktMTEuOTkuMzMtMjMuOTkuNDYtMzUuOTguNTMtMTQuMjQuMDktMjguNDguMDgtNDIuNzMuMDhoLTI3OGMtMTQuMjQsMC0yOC40OCwwLTQyLjczLS4wOC0xMi0uMDctMjMuOTktLjIxLTM1Ljk4LS41My0yNi4xMy0uNzEtNTIuNDktMi4yNS03OC4zNC02Ljg5LTI2LjIyLTQuNzEtNTAuNjItMTIuNC03NC40NC0yNC41My0yMy40MS0xMS45Mi00NC44NC0yNy40OS02My40MS00Ni4wNy0xOC41OC0xOC41OC0zNC4xNS00MC00Ni4wNy02My40MS0xMi4xMi0yMy44Mi0xOS44Mi00OC4yMi0yNC41My03NC40NC00LjY1LTI1Ljg0LTYuMTgtNTIuMi02Ljg5LTc4LjM0LS4zMy0xMS45OS0uNDYtMjMuOTktLjUzLTM1Ljk4QzAsNjc5LjQ4LDAsNjY1LjI0LDAsNjUxdi0yNzhDMCwzNTguNzYsMCwzNDQuNTIuMDgsMzMwLjI3Yy4wNy0xMiwuMjEtMjMuOTkuNTMtMzUuOTguNzEtMjYuMTMsMi4yNS01Mi40OSw2Ljg5LTc4LjM0LDQuNzEtMjYuMjIsMTIuNC01MC42MiwyNC41My03NC40NCwxMS45Mi0yMy40MSwyNy40OS00NC44NCw0Ni4wNy02My40MSwxOC41OC0xOC41OCw0MC0zNC4xNSw2My40MS00Ni4wNywyMy44Mi0xMi4xMiw0OC4yMi0xOS44Miw3NC40NC0yNC41MywyNS44NC00LjY1LDUyLjItNi4xOCw3OC4zNC02Ljg5LDExLjk5LS4zMywyMy45OS0uNDYsMzUuOTgtLjUzQzM0NC41MiwwLDM1OC43NiwwLDM3MywwaDI3OGMxNC4yNCwwLDI4LjQ4LDAsNDIuNzMuMDgsMTIsLjA3LDIzLjk5LjIxLDM1Ljk4LjUzLDI2LjEzLjcxLDUyLjQ5LDIuMjUsNzguMzQsNi44OSwyNi4yMiw0LjcxLDUwLjYyLDEyLjQsNzQuNDQsMjQuNTMsMjMuNDEsMTEuOTIsNDQuODQsMjcuNDksNjMuNDEsNDYuMDcsMTguNTgsMTguNTgsMzQuMTUsNDAsNDYuMDcsNjMuNDEsMTIuMTIsMjMuODIsMTkuODIsNDguMjIsMjQuNTMsNzQuNDQsNC42NSwyNS44NCw2LjE4LDUyLjIsNi44OSw3OC4zNC4zMywxMS45OS40NiwyMy45OS41MywzNS45OC4wOSwxNC4yNC4wOCwyOC40OC4wOCw0Mi43M3YyNzhaIi8+IDxnPiA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01MDAuNzMsMzI2LjAzdi03My42MWMwLTYuMSw0Ljk1LTExLjA0LDExLjA0LTExLjA0czExLjA0LDQuOTQsMTEuMDQsMTEuMDR2NzMuNjFjMCw2LjEtNC45NCwxMS4wNC0xMS4wNCwxMS4wNHMtMTEuMDQtNC45NC0xMS4wNC0xMS4wNFoiLz4gPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNTU3LjgyLDMzN2wzNi44LTYzLjc1YzMuMDUtNS4yOCw5LjgtNy4wOSwxNS4wOC00LjA0LDUuMjgsMy4wNSw3LjA5LDkuOCw0LjA0LDE1LjA4bC0zNi44LDYzLjc1Yy0zLjA1LDUuMjgtOS44LDcuMDktMTUuMDgsNC4wNC01LjI4LTMuMDUtNy4wOS05LjgtNC4wNC0xNS4wOFoiLz4gPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNDY1LjcyLDMzN2wtMzYuOC02My43NWMtMy4wNS01LjI4LTkuOC03LjA5LTE1LjA4LTQuMDQtNS4yOCwzLjA1LTcuMDksOS44LTQuMDQsMTUuMDhsMzYuOCw2My43NWMzLjA1LDUuMjgsOS44LDcuMDksMTUuMDgsNC4wNCw1LjI4LTMuMDUsNy4wOS05LjgsNC4wNC0xNS4wOFoiLz4gPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNODY1LjYzLDU2NS40YzAtMTkuMTksNS4xOC03Ni4wOCw2LjgtOTQuODUsMS4xLTEyLjY5LS40My0xOS42NS0yLjQ3LTIzLjItMS41LTIuNjEtMy44NC00LjQ1LTkuNDktNC44My00LjA4LS4yNy04LjUyLjg5LTExLjgzLDMuODgtMy4xMSwyLjgtNi41OCw4LjQ0LTYuNTgsMTkuODNsLS4wMi42NC01LjA3LDg2LjQ5Yy0uMTgsMy4xMS0xLjY3LDYuMDEtNC4xLDcuOTYtMi40MywxLjk1LTUuNTYsMi43OS04LjY0LDIuM2wtNTMuMTUtOC40MS01Ny4zMi03LjYxYy01LjI5LS43LTkuMzMtNS4xLTkuNTctMTAuNDNsLTMuMTYtNjguMzUtLjAzLS41OGMtMS40MS0yNy4yMS0yLjc1LTUyLjA0LTIuNzUtNTkuNzIsMC0yMS40Mi0zLjYzLTMwLjQ2LTYuNzktMzQuMjYtMi41My0zLjAzLTYuMTYtNC4zNi0xMy45NC00LjM2LTIuNzksMC00Ljc2LjU3LTYuMjQsMS40NC0xLjQ1Ljg1LTMuMTEsMi4zNy00LjY5LDUuMzUtMy4zOSw2LjM5LTUuODUsMTguMzktNC45MywzOS4zNiwxLjE5LDI3LjIsMy4wNCw0Ny41Miw0Ljg2LDY1Ljg0LDEuODEsMTguMjksMy42MiwzNC45LDQuNjMsNTQuMTksMS41NywzMC4yMSwxLjQzLDUxLjAzLjIsNjUuMTYtLjYyLDcuMDYtMS41MywxMi43Ni0yLjc3LDE3LjI3LTEuMTcsNC4yNy0yLjkzLDguNjItNS45NywxMS44Ni0zLjY5LDMuOTMtOC45NSw1LjgxLTE0LjQxLDQuNDktNC4zMy0xLjA0LTcuMzgtMy43OS05LjA0LTUuNTQtMy40OC0zLjY2LTUuOTQtOC4zOC02LjktMTAuODEtNS42MS0xNC4xNS0yMi45Ni00Ny4wMS00Ni40Ni02NS41Ni02Ljg1LTUuNDEtMTEuODUtNi45Ny0xNC45OS03LjIxLTIuOTYtLjIyLTUuMTEuNjUtNi44LDEuOTktMS44NiwxLjQ4LTMuMjUsMy42My0zLjk0LDUuNjYtLjI0LjcyLS4zNSwxLjIzLS4zOSwxLjU2LDYuMzcsMTAuNzUsMzEuNjMsNTAuMTYsNDMuNTQsOTAuMTUsOC44OCwyOS44MSwzMC4yOCw2MC4xOSw0Ni4yNyw3My4yLDE1LjQ4LDEyLjYsNDMuMjksMjAuNDEsNzQuNjIsMjEuOTUsMzEuMDQsMS41Miw2My0zLjIzLDg1LjUtMTMuMzIsNDMuNDYtMTkuNDgsNTIuMzEtNjIuMzgsNTYuMjctODAuOTgsMy4wOC0xNC40MywzLjE0LTI5Ljg0LDIuMzEtNDQuMTQtLjQxLTcuMTMtMS4wMi0xMy44LTEuNTYtMTkuOTUtLjUyLTUuOTctLjk5LTExLjc0LS45OS0xNi40N1pNNzYxLjY1LDM4MC4yNmMwLTYuNy0xLjc5LTEyLjY3LTQuNzUtMTYuNjYtMi42OC0zLjYxLTYuNjItNi4xMS0xMi45NS02LjExLTUuMTgsMC04LjY3LjY0LTExLjEzLDEuNjktMi4yLjk0LTQuMDUsMi40LTUuNzQsNS4xMi0zLjg4LDYuMjctNi43NCwxOC44OC02Ljc1LDQzLjk5bDIuNzUsNTkuNDVjMS4wMywxOS44MywyLjEsNDEuMzIsMi44LDU5LjE5bDM1Ljc3LDQuNzV2LTE1MS40MlpNNzgzLjczLDUzNC44NmwzMS45LDUuMDUsNC4zNS03My45NHYtNTcuMDJjMC03LjgzLTMuMTktMTIuNjItNi45Ni0xNS42OC00LjIxLTMuNDItOS4xMi00LjY0LTExLjQ0LTQuNjQtNC4yMiwwLTguNTkuNjYtMTEuNzMsMi44OS0yLjQyLDEuNzItNi4xMSw1Ljc4LTYuMTEsMTcuNDR2MTI1LjkxWk04NDIuMDYsNDI0LjQyYzYuNjEtMy4yOSwxMy42OC00LjM0LDE5Ljg5LTMuOTMsMTEuMjYuNzUsMjEuMTksNS40NywyNy4xNiwxNS44NSw1LjQyLDkuNDQsNi41NSwyMS45Miw1LjMyLDM2LjEyLTEuNywxOS42Mi02LjczLDc1LjAxLTYuNzMsOTIuOTQsMCwzLjYuMzgsOC4zOS45MSwxNC41Ni41Miw2LDEuMTcsMTMuMDUsMS42MSwyMC41OS44NywxNS4wNC45MywzMi43NC0yLjc2LDUwLjAyLTMuODQsMTgtMTQuMjQsNzIuMDQtNjguODQsOTYuNTItMjYuNTQsMTEuODktNjIuMiwxNi44Ny05NS42MiwxNS4yMy0zMy4xMy0xLjYzLTY2LjYxLTkuODgtODcuNDktMjYuODgtMTkuNjUtMTYtNDMuNDMtNTAuMjUtNTMuNDktODQuMDItMTEuMzYtMzguMTQtMzUuOTYtNzUuNzYtNDIuMS04Ni40Mi0zLjYyLTYuMjgtMi40OC0xMy43My0uOC0xOC43LDEuOS01LjYsNS41OC0xMS40NiwxMS4xMi0xNS44Niw1LjcxLTQuNTMsMTMuMjgtNy40LDIyLjItNi43Myw4Ljc0LjY2LDE3LjgsNC42NCwyNy4wMSwxMS45LDIzLjY5LDE4LjcxLDQxLjA4LDQ4LjIyLDQ5LjYsNjYuMzEuMDktLjgzLjE5LTEuNy4yNy0yLjYxLDEuMTEtMTIuNjUsMS4zLTMyLjMtLjI1LTYyLjEtLjk3LTE4LjY1LTIuNzEtMzQuNjItNC41NS01My4xNi0xLjg0LTE4LjUxLTMuNzQtMzkuMjgtNC45NS02Ny4wNi0uOTctMjIuMTYsMS4zLTM5LDcuNDgtNTAuNjYsMy4yLTYuMDUsNy41NC0xMC44NiwxMy4wNS0xNC4wOCw1LjQ5LTMuMjEsMTEuNDctNC40NSwxNy4zOC00LjQ1LDguNzQsMCwxOS42MywxLjIzLDI4LjI5LDkuNTEuNzctMS42NCwxLjYtMy4xOSwyLjUxLTQuNjUsNC02LjQ3LDkuMzMtMTEuMDMsMTUuODUtMTMuODEsNi4yNy0yLjY3LDEzLjA3LTMuNDYsMTkuNzktMy40NiwxMy41MSwwLDIzLjk1LDUuOTYsMzAuNjgsMTUuMDQsNC4zNiw1Ljg3LDYuOTcsMTIuNzcsOC4yMSwxOS43Nyw3LjE3LTMuMjQsMTQuMzQtMy42NiwxOC43My0zLjY2LDcuNDksMCwxNy4zLDMuMDMsMjUuMzYsOS41OSw4LjUsNi45LDE1LjEzLDE3LjgsMTUuMTMsMzIuODJ2MTUuNDdaIi8+IDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTE1OC4zNyw1NjUuNGMwLTE5LjE5LTUuMTgtNzYuMDgtNi44LTk0Ljg1LTEuMS0xMi42OS40My0xOS42NSwyLjQ3LTIzLjIsMS41LTIuNjEsMy44NC00LjQ1LDkuNDgtNC44Myw0LjA4LS4yNyw4LjUyLjg5LDExLjg0LDMuODgsMy4xMSwyLjgsNi41OCw4LjQ0LDYuNTgsMTkuODNsLjAyLjY0LDUuMDcsODYuNDljLjE4LDMuMTEsMS42Nyw2LjAxLDQuMSw3Ljk2LDIuNDMsMS45NSw1LjU3LDIuNzksOC42NSwyLjNsNTMuMTUtOC40MSw1Ny4zMi03LjYxYzUuMy0uNyw5LjMzLTUuMSw5LjU3LTEwLjQzbDMuMTYtNjguMzUuMDMtLjU4YzEuNDEtMjcuMjEsMi43NC01Mi4wNCwyLjc0LTU5LjcyLDAtMjEuNDIsMy42My0zMC40Niw2LjgtMzQuMjYsMi41My0zLjAzLDYuMTYtNC4zNiwxMy45NC00LjM2LDIuNzksMCw0Ljc2LjU3LDYuMjQsMS40NCwxLjQ1Ljg1LDMuMTEsMi4zNyw0LjY5LDUuMzUsMy4zOCw2LjM5LDUuODUsMTguMzksNC45MywzOS4zNi0xLjE5LDI3LjItMy4wNCw0Ny41Mi00Ljg2LDY1Ljg0LTEuODEsMTguMjktMy42MiwzNC45LTQuNjMsNTQuMTktMS41NywzMC4yMS0xLjQzLDUxLjAzLS4yLDY1LjE2LjYyLDcuMDYsMS41MywxMi43NiwyLjc2LDE3LjI3LDEuMTcsNC4yNywyLjkyLDguNjIsNS45NywxMS44NiwzLjY5LDMuOTMsOC45NSw1LjgxLDE0LjQxLDQuNDksNC4zMy0xLjA0LDcuMzgtMy43OSw5LjA0LTUuNTQsMy40OC0zLjY2LDUuOTQtOC4zOCw2LjktMTAuODEsNS42MS0xNC4xNSwyMi45Ni00Ny4wMSw0Ni40Ni02NS41Niw2Ljg1LTUuNDEsMTEuODUtNi45NywxNC45OS03LjIxLDIuOTYtLjIyLDUuMTEuNjUsNi44LDEuOTksMS44NiwxLjQ4LDMuMjUsMy42MywzLjk0LDUuNjYuMjQuNzIuMzUsMS4yMy4zOSwxLjU2LTYuMzcsMTAuNzUtMzEuNjMsNTAuMTYtNDMuNTQsOTAuMTUtOC44OCwyOS44MS0zMC4yOCw2MC4xOS00Ni4yNyw3My4yLTE1LjQ4LDEyLjYtNDMuMjksMjAuNDEtNzQuNjIsMjEuOTUtMzEuMDMsMS41Mi02My0zLjIzLTg1LjUtMTMuMzItNDMuNDYtMTkuNDgtNTIuMzEtNjIuMzgtNTYuMjgtODAuOTgtMy4wOC0xNC40My0zLjE0LTI5Ljg0LTIuMzEtNDQuMTQuNDEtNy4xMywxLjAyLTEzLjgsMS41Ni0xOS45NS41Mi01Ljk3Ljk5LTExLjc0Ljk5LTE2LjQ3Wk0yNjIuMzUsMzgwLjI2YzAtNi43LDEuNzktMTIuNjcsNC43NS0xNi42NiwyLjY4LTMuNjEsNi42Mi02LjExLDEyLjk1LTYuMTEsNS4xOCwwLDguNjcuNjQsMTEuMTMsMS42OSwyLjIxLjk0LDQuMDYsMi40LDUuNzQsNS4xMiwzLjg5LDYuMjcsNi43NCwxOC44OCw2Ljc1LDQzLjk5bC0yLjc1LDU5LjQ1Yy0xLjAzLDE5LjgzLTIuMSw0MS4zMi0yLjgsNTkuMTlsLTM1Ljc3LDQuNzV2LTE1MS40MlpNMjQwLjI3LDUzNC44NmwtMzEuOSw1LjA1LTQuMzUtNzMuOTR2LTU3LjAyYzAtNy44MywzLjE5LTEyLjYyLDYuOTctMTUuNjgsNC4yMS0zLjQyLDkuMTItNC42NCwxMS40NC00LjY0LDQuMjMsMCw4LjU5LjY2LDExLjczLDIuODksMi40MiwxLjcyLDYuMTEsNS43OCw2LjExLDE3LjQ0djEyNS45MVpNMTgxLjk0LDQyNC40MmMtNi42MS0zLjI5LTEzLjY4LTQuMzQtMTkuODktMy45My0xMS4yNi43NS0yMS4xOSw1LjQ3LTI3LjE2LDE1Ljg1LTUuNDIsOS40NC02LjU1LDIxLjkyLTUuMzIsMzYuMTIsMS43LDE5LjYyLDYuNzMsNzUuMDEsNi43Myw5Mi45NCwwLDMuNi0uMzcsOC4zOS0uOTEsMTQuNTYtLjUyLDYtMS4xNywxMy4wNS0xLjYxLDIwLjU5LS44NywxNS4wNC0uOTMsMzIuNzQsMi43Niw1MC4wMiwzLjg0LDE4LDE0LjIzLDcyLjA0LDY4Ljg0LDk2LjUyLDI2LjUzLDExLjg5LDYyLjIsMTYuODcsOTUuNjIsMTUuMjMsMzMuMTMtMS42Myw2Ni42MS05Ljg4LDg3LjQ4LTI2Ljg4LDE5LjY1LTE2LDQzLjQzLTUwLjI1LDUzLjQ5LTg0LjAyLDExLjM2LTM4LjE0LDM1Ljk2LTc1Ljc2LDQyLjEtODYuNDIsMy42Mi02LjI4LDIuNDgtMTMuNzMuOC0xOC43LTEuOS01LjYtNS41OC0xMS40Ni0xMS4xMi0xNS44Ni01LjcxLTQuNTMtMTMuMjgtNy40LTIyLjItNi43My04Ljc0LjY2LTE3LjgsNC42NC0yNy4wMSwxMS45LTIzLjY5LDE4LjcxLTQxLjA4LDQ4LjIyLTQ5LjYsNjYuMzEtLjA5LS44My0uMTktMS43LS4yNy0yLjYxLTEuMTEtMTIuNjUtMS4zLTMyLjMuMjUtNjIuMS45Ny0xOC42NSwyLjcxLTM0LjYyLDQuNTUtNTMuMTYsMS44My0xOC41MSwzLjczLTM5LjI4LDQuOTUtNjcuMDYuOTctMjIuMTYtMS4zMS0zOS03LjQ4LTUwLjY2LTMuMi02LjA1LTcuNTQtMTAuODYtMTMuMDUtMTQuMDgtNS40OS0zLjIxLTExLjQ3LTQuNDUtMTcuMzgtNC40NS04Ljc0LDAtMTkuNjIsMS4yMy0yOC4yOSw5LjUxLS43Ni0xLjY0LTEuNi0zLjE5LTIuNS00LjY1LTQtNi40Ny05LjMzLTExLjAzLTE1Ljg1LTEzLjgxLTYuMjctMi42Ny0xMy4wNy0zLjQ2LTE5Ljc5LTMuNDYtMTMuNTEsMC0yMy45NSw1Ljk2LTMwLjY4LDE1LjA0LTQuMzYsNS44Ny02Ljk3LDEyLjc3LTguMjIsMTkuNzctNy4xNy0zLjI0LTE0LjM0LTMuNjYtMTguNzMtMy42Ni03LjQ5LDAtMTcuMywzLjAzLTI1LjM2LDkuNTktOC41LDYuOS0xNS4xMywxNy44LTE1LjEzLDMyLjgydjE1LjQ3WiIvPiA8L2c+IDwvc3ZnPgo=";

/** Fallback colours behind the --mb-* aliases; tests check their contrast. */
export const FALLBACKS = {
  bg: "#0B0E14", panel: "#2B3037", text: "#EEF2F7", muted: "#B4BBC6", contrast: "#FFFFFF", onContrast: "#000000",
  accent: "#C9B974", onAccent: "#0B0E14", phoneBg: "#181818", phoneText: "#EEF2F7", phoneMuted: "#A3B0C4", phoneRaised: "#2A2A2A",
  stageBg: "#05070B", stageText: "#F5F7FA", stageMuted: "#BAC1CB", btnFill: "#FFFFFF", onBtnFill: "#000000",
  grad1: "#1C1F24", grad2: "#2B3037", grad3: "#3A4048", glow: "#5C6572",
};

export const FEATURES = [
  {
    id: "pairing",
    kicker: "Pairing",
    title: "Scan once. Connected.",
    body: "Open Settings → Mobile in Agent Canvas on your laptop and scan the code with the phone camera, or photograph it and let the app read it from the picture. The phone can be on any network. If you prefer, type a name, host and session API key yourself.",
    mock: "connect",
  },
  {
    id: "conversations",
    kicker: "Conversations",
    title: "Your threads, live.",
    body: "See the conversations on the paired agent server, open one to load recent history, and watch new events stream in. Send messages into an existing thread or start a new chat. The chat shows Live while the event socket is up. Wide screens get a list and chat side by side. Dictate a message with the microphone in the composer.",
    mock: "chat",
  },
  {
    id: "customize",
    kicker: "Customize",
    title: "Tune it from the couch.",
    body: "A Customize screen lists the laptop’s MCP servers, skills and plugins, so you can look at them and change them from the phone. Changes go to the same OpenHands backend the laptop uses.",
    mock: "customize",
  },
  {
    id: "automations",
    kicker: "Automations",
    title: "Put work on a schedule.",
    body: "An Automations screen has a Dashboard and a Templates tab. Open an automation to see its trigger, last run and prompt, switch it on or off, or run it now. Recommended templates, such as GitHub code review, AGENTS.md Maintainer and Daily news digest, start a chat that sets them up. Create an automation starts that same kind of chat from scratch.",
    mock: "automations",
  },
];

export const SPECS = [
  { value: "Expo 57", label: "React Native 0.86 with the new architecture. One app for iPhone, Android, iPad and tablets." },
  { value: "iOS project", label: "A native Xcode project is checked in, bundle id dev.openhands.mobile. Android build config is there too." },
  { value: "0.1.0", label: "An early MVP. Expect rough edges." },
  { value: "Any network", label: "QR pairing carries a short-lived public link, so phone and laptop need not share Wi‑Fi." },
];

export const STEPS = [
  { title: "Get the app", body: "Clone the openhands-mobile repository, run npm install, then build a development client with npm run ios:device or npm run android:device. Expo Go is not supported." },
  { title: "Open the pairing page", body: "In Agent Canvas go to Settings → Mobile. Canvas shows a QR code for this computer." },
  { title: "Scan it", body: "In the app choose Open camera scanner, or Take photo of QR. The app saves the host and session key in the phone’s secure storage and connects." },
  { title: "Work from anywhere", body: "Your conversations, Customize and Automations appear on the phone, backed by the laptop’s OpenHands. If the laptop sleeps or OpenHands quits, the phone shows Offline." },
];

export const INSTALL_BLOCKS = [
  {
    id: "source",
    title: "Get the source",
    body: "Needs Node.js 20 or newer. Do not use Expo Go: build a development client.",
    commands: CLONE_COMMAND,
  },
  {
    id: "ios",
    title: "Run on your iPhone",
    body: "Needs macOS, Xcode, an Apple Developer team and a registered device. Plug the phone in, run this, and on the first build choose your Development Team for bundle id dev.openhands.mobile. Trust the developer certificate on the device if iOS asks.",
    commands: "npm run ios:device",
  },
  {
    id: "android",
    title: "Or run on Android",
    body: "Enable USB debugging and plug in the phone (or start an emulator). For an APK that needs no USB or Metro after install, build it with EAS; eas.json also has a preview profile for an internal APK.",
    commands: "npm run android:device",
    extra: { label: "APK via EAS", commands: "npx eas build -p android --profile development" },
  },
];

// ─── Icons (SVG data-URL masks) ────────────────────────────────────────────

const ICON_PATHS = {
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"/>',
  puzzle: '<path d="M10 4h4v3a2 2 0 1 0 0 4h3v4h-3a2 2 0 1 0 0 4v1h-4v-3a2 2 0 1 0-4 0v-1H4v-4h3a2 2 0 1 0 0-4H4V4z"/>',
};
export function maskUrl(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ""}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const F = FALLBACKS;
const STYLE = `
/* Graphite palette: change these four tokens to re-hue every gradient, band and glow on the page. */
.mb { --mb-grad-1: ${F.grad1}; --mb-grad-2: ${F.grad2}; --mb-grad-3: ${F.grad3}; --mb-glow: ${F.glow};
  --mb-bg: var(--oh-color-base, ${F.bg}); --mb-panel: var(--oh-color-base-secondary, ${F.panel}); --mb-text: var(--oh-foreground, ${F.text});
  --mb-muted: var(--oh-muted, ${F.muted}); --mb-border: var(--oh-border-subtle, #383F50); --mb-contrast: var(--oh-contrast, ${F.contrast});
  --mb-on-contrast: var(--oh-contrast-foreground, ${F.onContrast}); --mb-accent: var(--oh-accent, ${F.accent}); --mb-on-accent: var(--oh-accent-foreground, ${F.onAccent});
  --mb-s-bg: ${F.stageBg}; --mb-s-text: ${F.stageText}; --mb-s-muted: ${F.stageMuted}; --mb-s-line: #4A5468;
  --mb-phone-bg: ${F.phoneBg}; --mb-phone-text: ${F.phoneText}; --mb-phone-muted: ${F.phoneMuted}; --mb-phone-raised: ${F.phoneRaised};
  box-sizing: border-box; height: 100%; min-height: 480px; overflow-y: auto; overflow-x: hidden; container-type: inline-size; position: relative;
  background: var(--mb-bg); color: var(--mb-text); font: 16px/1.5 -apple-system, "SF Pro Display", "SF Pro Text", Inter, system-ui, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.mb[hidden] { display: none; }
.mb *, .mb *::before, .mb *::after { box-sizing: border-box; }
.mb h1, .mb h2, .mb h3, .mb p, .mb ol, .mb ul, .mb figure, .mb pre { margin: 0; }
.mb section { position: relative; }
.mb .in { max-width: 1120px; margin: 0 auto; padding: 72px 24px; }
.mb .st { background: var(--mb-bg); color: var(--mb-s-text); overflow: hidden; }
.mb .st h1, .mb .st h2, .mb .st h3 { color: var(--mb-s-text); }
.mb .st .muted { color: var(--mb-s-muted); }
.mb .hs { background: var(--mb-bg); background: linear-gradient(180deg, color-mix(in srgb, var(--mb-bg) 92%, var(--mb-grad-3)), var(--mb-bg)); color: var(--mb-text); }
/* Stage bands start and end on the host base so they meet the app with no seam; the graphite sits behind the text. */
.mb .hero { background: linear-gradient(180deg, var(--mb-bg) 0, var(--mb-grad-3) 112px, var(--mb-grad-2) calc(100% - 96px), var(--mb-bg) 100%); }
.mb .fx { background: linear-gradient(180deg, var(--mb-bg) 0, var(--mb-grad-2) 88px, var(--mb-grad-1) calc(100% - 88px), var(--mb-bg) 100%); }
.mb .cta { background: linear-gradient(180deg, var(--mb-bg) 0, var(--mb-grad-2) 112px, var(--mb-grad-1) calc(100% - 96px), var(--mb-bg) 100%); }
.mb .hs h2, .mb .hs h3 { color: var(--mb-contrast); }
.mb .muted { color: var(--mb-muted); }
.mb h1, .mb h2 { font-weight: 400; letter-spacing: -0.02em; line-height: 1.04; overflow-wrap: anywhere; }
.mb h1 { font-size: clamp(40px, 7vw, 88px); font-size: clamp(40px, 7cqw, 88px); line-height: 1; letter-spacing: -0.03em; }
.mb h2 { font-size: clamp(32px, 5vw, 64px); font-size: clamp(32px, 5.2cqw, 64px); }
.mb h3 { font-size: 20px; font-weight: 400; letter-spacing: -0.01em; }
.mb .eyebrow { font-size: 14px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; }
.mb .lede { font-size: clamp(18px, 2.4vw, 26px); font-size: clamp(18px, 2.6cqw, 26px); font-weight: 400; line-height: 1.3; letter-spacing: -0.01em; max-width: 34ch; }
.mb .fine { font-size: 14px; max-width: 52ch; }
/* hero */
.mb .hero .in { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px; padding-top: 112px; padding-bottom: 0; }
.mb .hero::before { content: ""; position: absolute; left: 50%; top: -20%; width: 120%; max-width: 1400px; aspect-ratio: 1; transform: translateX(-50%); background: radial-gradient(closest-side, var(--mb-glow), transparent 70%); opacity: 0.3; pointer-events: none; }
.mb .hero .in > * { position: relative; }
.mb .brand img { display: block; width: 72px; height: 72px; border-radius: 18px; box-shadow: 0 0 0 1px var(--mb-grad-3), 0 12px 40px rgba(92, 101, 114, 0.35); }
.mb .hero h1 { background: linear-gradient(180deg, #FFFFFF 30%, #AEB5C0); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: #FFFFFF; padding-bottom: 0.08em; }
.mb .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.mb .hero .stagewrap { margin-top: 32px; padding-bottom: 0; }
.mb .btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; border-radius: 999px; border: 1px solid var(--mb-border); background: transparent; color: var(--mb-text); font: inherit; font-size: 16px; font-weight: 500; cursor: pointer; text-decoration: none; transition: opacity 0.2s, border-color 0.2s; }
.mb .btn:hover { border-color: currentColor; }
.mb .st .btn { border-color: var(--mb-s-line); color: var(--mb-s-text); }
.mb .st .btn.primary { background: #FFFFFF; color: #000000; border-color: #FFFFFF; }
.mb .hs .btn.primary { background: var(--mb-contrast); color: var(--mb-on-contrast); border-color: var(--mb-contrast); }
.mb .btn.primary:hover { opacity: 0.88; }
.mb :is(button, a):focus-visible { outline: 3px solid var(--mb-accent); outline-offset: 3px; }
.mb .st :is(button, a):focus-visible { outline-color: #E9D98A; }
.mb .ico { display: inline-block; width: 18px; height: 18px; flex: none; background: currentColor; -webkit-mask: var(--mb-mask) center / contain no-repeat; mask: var(--mb-mask) center / contain no-repeat; }
.mb code { padding: 1px 6px; border-radius: 4px; background: var(--mb-panel); color: var(--mb-text); font: 13px ui-monospace, "SF Mono", Menlo, monospace; overflow-wrap: anywhere; }
/* features */
.mb .fx .in { display: grid; gap: 48px; align-items: center; padding-top: 88px; padding-bottom: 88px; }
.mb .fx .copy { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.mb .fx .kicker { display: flex; align-items: center; gap: 8px; color: var(--mb-s-muted); }
.mb .fx .copy p.muted { font-size: 18px; font-weight: 400; line-height: 1.5; max-width: 46ch; }
@container (min-width: 760px) {
  .mb .fx .in { grid-template-columns: 1fr 1fr; gap: 72px; }
  .mb .fx.flip .mockwrap { order: -1; }
}
/* phone mockup */
.mb .mockwrap { position: relative; isolation: isolate; display: flex; flex-direction: column; align-items: center; gap: 14px; justify-self: center; }
.mb .mockwrap::before { content: ""; position: absolute; z-index: -1; left: 50%; top: 42%; width: 130%; aspect-ratio: 1; transform: translate(-50%, -50%); background: radial-gradient(closest-side, var(--mb-glow), transparent 70%); opacity: 0.45; pointer-events: none; }
.mb figcaption { font-size: 12px; color: var(--mb-s-muted); text-align: center; }
.mb .phone { --pw: clamp(208px, 60cqw, 280px); position: relative; width: var(--pw); height: calc(var(--pw) * 2.06); font-size: calc(var(--pw) / 21); padding: 0.5em; border-radius: 3.4em;
  background: linear-gradient(145deg, #4B5262, #10131A 35%, #2A303C 70%, #0C0E13); box-shadow: 0 0 0 1px #05070B, inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 3em 6em -1.5em rgba(0, 0, 0, 0.75); }
.mb .hero .phone { --pw: clamp(228px, 66cqw, 320px); animation: mb-float 7s ease-in-out infinite; }
@keyframes mb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.mb .screen { position: relative; height: 100%; border-radius: 2.9em; overflow: hidden; background: var(--mb-phone-bg); color: var(--mb-phone-text); padding: 3.7em 1.1em 2em; display: flex; flex-direction: column; gap: 0.7em; line-height: 1.3; text-align: left; }
.mb .island { position: absolute; top: 0.85em; left: 50%; transform: translateX(-50%); width: 6.4em; height: 1.9em; border-radius: 999px; background: #000000; }
.mb .sbar { position: absolute; top: 1em; left: 1.8em; right: 1.8em; display: flex; justify-content: space-between; align-items: center; font-size: 0.85em; font-weight: 400; color: var(--mb-phone-text); }
.mb .batt { width: 1.9em; height: 0.9em; border-radius: 0.3em; border: 1px solid var(--mb-phone-muted); padding: 1px; }
.mb .batt::after { content: ""; display: block; width: 75%; height: 100%; border-radius: 0.15em; background: var(--mb-phone-text); }
.mb .home { position: absolute; bottom: 0.6em; left: 50%; transform: translateX(-50%); width: 7em; height: 0.34em; border-radius: 9px; background: var(--mb-phone-text); opacity: 0.85; }
.mb .screen .sm { color: var(--mb-phone-muted); font-size: 0.85em; }
.mb .screen .st2 { font-size: 1.5em; font-weight: 400; letter-spacing: -0.02em; color: var(--mb-phone-text); line-height: 1.1; }
.mb .screen .live { display: inline-flex; align-items: center; gap: 0.4em; color: var(--mb-phone-text); font-size: 0.85em; }
.mb .screen .live::before { content: ""; width: 0.6em; height: 0.6em; border-radius: 50%; background: #3DDC84; }
.mb .screen .row { display: flex; align-items: center; gap: 0.7em; padding: 0.75em 0.8em; border-radius: 1em; background: var(--mb-phone-raised); color: var(--mb-phone-text); }
.mb .screen .row .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mb .screen .row b { font-weight: 400; }
.mb .screen .tile { width: 2.1em; height: 2.1em; flex: none; display: grid; place-items: center; border-radius: 0.6em; background: #3A4150; color: var(--mb-phone-text); }
.mb .screen .tile .ico { width: 1.2em; height: 1.2em; }
.mb .screen .sw { width: 2.1em; height: 1.2em; flex: none; border-radius: 999px; background: #3DDC84; position: relative; }
.mb .screen .sw::after { content: ""; position: absolute; top: 0.15em; right: 0.15em; width: 0.9em; height: 0.9em; border-radius: 50%; background: #FFFFFF; }
.mb .screen .sw.off { background: #555B66; }
.mb .screen .sw.off::after { right: auto; left: 0.15em; }
.mb .screen .pill { padding: 0.8em 0.9em; border-radius: 999px; text-align: center; font-weight: 400; background: #FFFFFF; color: #000000; }
.mb .screen .pill.alt { background: transparent; color: var(--mb-phone-text); border: 1px solid #5A6070; }
.mb .screen .tabs { display: flex; gap: 0.5em; }
.mb .screen .tabs span { padding: 0.4em 0.9em; border-radius: 999px; border: 1px solid #5A6070; color: var(--mb-phone-text); }
.mb .screen .tabs span.on { background: #FFFFFF; color: #000000; border-color: #FFFFFF; }
.mb .screen .bubble { padding: 0.7em 0.9em; border-radius: 1.1em; background: var(--mb-phone-raised); color: var(--mb-phone-text); max-width: 88%; }
.mb .screen .bubble.me { align-self: flex-end; background: #FFFFFF; color: #000000; }
.mb .screen .chip { align-self: flex-start; padding: 0.35em 0.8em; border-radius: 999px; border: 1px solid #5A6070; color: var(--mb-phone-muted); font-size: 0.85em; }
.mb .screen .grow2 { flex: 1; }
.mb .screen .composer { display: flex; align-items: center; justify-content: space-between; gap: 0.6em; padding: 0.4em 0.4em 0.4em 1em; border-radius: 999px; border: 1px solid #5A6070; color: var(--mb-phone-text); margin-bottom: 0.4em; }
.mb .screen .wave { display: flex; align-items: center; gap: 0.2em; height: 1.6em; flex: 1; }
.mb .screen .wave i { width: 0.22em; border-radius: 9px; background: #3DDC84; }
.mb .screen .micbtn { width: 2.3em; height: 2.3em; border-radius: 50%; display: grid; place-items: center; background: #FFFFFF; color: #000000; }
.mb .screen .micbtn .ico { width: 1.2em; height: 1.2em; }
.mb .screen .field { padding: 0.65em 0.9em; border-radius: 0.9em; border: 1px solid #5A6070; color: var(--mb-phone-muted); }
.mb .qrbox { align-self: center; width: 9.6em; height: 9.6em; display: grid; grid-template-columns: repeat(11, 1fr); padding: 0.7em; background: #FFFFFF; border-radius: 1em; margin: 0.4em 0; }
.mb .qrbox i { background: #000000; }
.mb .qrbox i.o { background: #FFFFFF; }
/* specs + steps */
.mb .specs-sec .in { display: flex; flex-direction: column; gap: 40px; }
.mb .specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 32px; padding: 0; list-style: none; }
.mb .specs li { display: flex; flex-direction: column; gap: 8px; padding-top: 20px; border-top: 1px solid var(--mb-border); }
.mb .specs .val { font-size: clamp(28px, 4vw, 44px); font-size: clamp(28px, 4.2cqw, 44px); font-weight: 400; letter-spacing: -0.03em; line-height: 1.05; color: var(--mb-contrast); }
.mb .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 0; list-style: none; counter-reset: step; }
.mb .steps li { counter-increment: step; display: flex; flex-direction: column; gap: 8px; padding: 20px; border: 1px solid var(--mb-border); border-radius: 20px; background: var(--mb-panel); }
.mb .steps li::before { content: counter(step); width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--mb-accent); color: var(--mb-on-accent); font-weight: 400; }
.mb .block .in { display: flex; flex-direction: column; gap: 28px; }
.mb .hs + .hs { border-top: 1px solid var(--mb-border); }
/* download */
.mb .dl .in { display: flex; flex-direction: column; gap: 32px; }
.mb .dl .head { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.mb .dl .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }
.mb .dl .card { display: flex; flex-direction: column; gap: 14px; padding: 22px; border: 1px solid var(--mb-border); border-radius: 22px; background: var(--mb-panel); min-width: 0; }
.mb .dl .card .num { font-size: 13px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-muted); }
.mb .dl .card p { font-size: 15px; }
.mb .codeblock { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.mb .codeblock .cl { font-size: 13px; color: var(--mb-muted); }
.mb .cb { display: flex; flex-direction: column; border: 1px solid var(--mb-border); border-radius: 12px; background: var(--mb-bg); padding: 6px 6px 0; min-width: 0; position: relative; }
.mb .cb pre { min-width: 0; overflow-x: auto; padding: 6px 8px 12px; font: 13px/1.6 ui-monospace, "SF Mono", Menlo, monospace; color: var(--mb-text); }
.mb .cb pre code { padding: 0; background: none; font: inherit; overflow-wrap: normal; }
.mb button.copy { order: -1; align-self: flex-end; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--mb-border); background: var(--mb-panel); color: var(--mb-text); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.mb button.copy:hover { border-color: var(--mb-text); }
.mb .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
/* closing */
.mb .cta .in { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px; padding-top: 112px; padding-bottom: 96px; }
.mb .cta::before { content: ""; position: absolute; left: 50%; bottom: -60%; width: 120%; max-width: 1400px; aspect-ratio: 1; transform: translateX(-50%); background: radial-gradient(closest-side, var(--mb-glow), transparent 70%); opacity: 0.3; pointer-events: none; }
.mb .cta .in > * { position: relative; }
.mb .cta .fine { max-width: 62ch; }
/* motion */
.mb.js .rv { opacity: 0; transform: translateY(28px); transition: opacity 0.9s cubic-bezier(0.2, 0.7, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1); }
.mb.js .rv.in2 { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .mb .hero .phone { animation: none; }
  .mb.js .rv { opacity: 1; transform: none; transition: none; }
}
@media (max-width: 520px) { .mb .in { padding-left: 16px; padding-right: 16px; } .mb .fx .in { padding-top: 64px; padding-bottom: 64px; gap: 40px; } .mb .btn { padding: 12px 20px; } }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function icon(name) {
  const node = el("span", "ico");
  node.setAttribute("aria-hidden", "true");
  node.style.setProperty("--mb-mask", maskUrl(name));
  return node;
}
function section(className, labelId) {
  const s = el("section", className);
  if (labelId) s.setAttribute("aria-labelledby", labelId);
  const inner = el("div", "in");
  s.append(inner);
  return { s, inner };
}
function heading(tag, id, text, className) {
  const h = el(tag, className || "", text);
  if (id) h.id = id;
  return h;
}
function actionButton(label, iconName, action, handler, primary = true) {
  const b = el("button", primary ? "btn primary" : "btn");
  b.type = "button";
  b.dataset.action = action;
  b.append(icon(iconName), el("span", "", label));
  b.addEventListener("click", handler);
  return b;
}

/** Clipboard write with an execCommand fallback; resolves to true when copied. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the textarea fallback */ }
  try {
    const ta = el("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(ta);
    ta.select();
    const ok = typeof document.execCommand === "function" && document.execCommand("copy");
    ta.remove();
    return !!ok;
  } catch {
    return false;
  }
}

function codeBlock(label, commands, timers) {
  const wrap = el("div", "codeblock");
  if (label) wrap.append(el("div", "cl", label));
  const box = el("div", "cb");
  const pre = el("pre");
  pre.tabIndex = 0;
  pre.append(el("code", "", commands));
  const btn = el("button", "copy", "Copy");
  btn.type = "button";
  btn.setAttribute("aria-label", `Copy ${commands.split("\n")[0]}${commands.includes("\n") ? " and the next commands" : ""}`);
  const live = el("span", "sr");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  btn.addEventListener("click", async () => {
    const ok = await copyText(commands);
    btn.textContent = ok ? "Copied" : "Copy failed";
    live.textContent = ok ? "Copied" : "Copy failed. Select the text and copy it.";
    timers.push(setTimeout(() => { btn.textContent = "Copy"; live.textContent = ""; }, 2000));
  });
  box.append(pre, btn, live);
  wrap.append(box);
  return wrap;
}

// ─── Phone mockups ────────────────────────────────────────────────────────────

/** 11x11 QR-like pattern: three finder squares plus deterministic noise. */
export function qrCells() {
  const n = 11;
  const cells = [];
  let seed = 7;
  const finder = (dx, dy) => dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let on;
      if (x < 7 && y < 7) on = finder(x, y);
      else if (x >= n - 7 && y < 7) on = finder(x - (n - 7), y);
      else if (x < 7 && y >= n - 7) on = finder(x, y - (n - 7));
      else { seed = (seed * 48271) % 2147483647; on = seed % 2 === 0; }
      cells.push(on);
    }
  }
  return cells;
}

function listRow(iconName, title, sub, tail) {
  const r = el("div", "row");
  if (iconName) { const t = el("span", "tile"); t.append(icon(iconName)); r.append(t); }
  const g = el("span", "grow");
  g.append(el("b", "", title));
  if (sub) g.append(el("span", "sm", sub));
  r.append(g);
  if (tail) r.append(tail);
  return r;
}

function mockScreen(kind) {
  const s = el("div", "screen");
  const island = el("div", "island");
  island.setAttribute("aria-hidden", "true");
  const sbar = el("div", "sbar");
  const batt = el("span", "batt");
  batt.setAttribute("aria-hidden", "true");
  sbar.append(el("span", "", "9:41"), batt);
  s.append(island, sbar, el("div", "home"));
  if (kind === "connect") {
    s.append(el("div", "sm", "OpenHands Mobile"), el("div", "st2", "Pair with Agent Canvas"));
    const qr = el("div", "qrbox");
    qr.setAttribute("aria-hidden", "true");
    qrCells().forEach((on) => qr.append(el("i", on ? "" : "o")));
    s.append(qr, el("div", "pill", "Open camera scanner"), el("div", "pill alt", "Take photo of QR"), el("div", "field", "Or enter host and session key"));
  } else if (kind === "chat") {
    s.append(el("div", "st2", "Conversation"), el("div", "live", "Live"));
    s.append(el("div", "bubble me", "Add tests for the parser"), el("div", "bubble", "On it. Reading the existing tests first."), el("div", "chip", "Reading tests/test_parser.py"), el("div", "grow2"));
    const c = el("div", "composer");
    const wave = el("span", "wave");
    wave.setAttribute("aria-hidden", "true");
    [40, 70, 100, 55, 85, 35, 60].forEach((h) => { const i = el("i"); i.style.height = `${h}%`; wave.append(i); });
    const mic = el("span", "micbtn");
    mic.append(icon("mic"));
    c.append(el("span", "", "Dictating"), wave, mic);
    s.append(c);
  } else if (kind === "customize") {
    s.append(el("div", "st2", "Customize"), el("div", "sm", "Skills, MCP servers, and plugins from the laptop."));
    const sw = (off) => el("span", off ? "sw off" : "sw");
    s.append(listRow("plug", "MCP Servers", "Tools the agent can call", sw(false)), listRow("book", "Skills", "Reusable instructions", sw(false)), listRow("puzzle", "Plugins", "Bundles of both", sw(true)));
  } else if (kind === "list") {
    s.append(el("div", "st2", "Conversations"), el("div", "live", "Live"));
    s.append(listRow("chat", "Add tests for the parser", "Running"), listRow("chat", "Update AGENTS.md", "Finished"), listRow("chat", "Triage new issues", "Finished"), listRow("chat", "Daily news digest", "Finished"), listRow("chat", "Review open pull requests", "Finished"), el("div", "grow2"), el("div", "pill", "New chat"));
  } else {
    s.append(el("div", "st2", "Automations"));
    const tabs = el("div", "tabs");
    tabs.append(el("span", "", "Dashboard"), el("span", "on", "Templates"));
    s.append(tabs);
    for (const [name, cat] of [["GitHub code review", "Code review"], ["AGENTS.md Maintainer", "Documentation"], ["Daily news digest", "Research"]]) s.append(listRow("clock", name, cat));
    s.append(el("div", "grow2"), el("div", "pill", "Create an automation"));
  }
  return s;
}

function phone(kind, label, opts = {}) {
  const wrap = el("figure", "mockwrap rv");
  const par = el("div", "par");
  par.dataset.par = String(opts.speed ?? 0.06);
  const p = el("div", "phone");
  p.setAttribute("role", "img");
  p.setAttribute("aria-label", `Illustration of the ${label} screen`);
  p.append(mockScreen(kind));
  par.append(p);
  wrap.append(par, el("figcaption", "", "Illustration, not a screenshot"));
  return wrap;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function mountPage(container, host) {
  const root = el("div", "mb");
  root.append(el("style", "", STYLE));
  const timers = [];
  const reduced = !!(typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)")?.matches);
  const go = (route) => () => host.navigate(route);
  let downloadSection = null;
  const scrollToDownload = () => {
    if (!downloadSection) return;
    downloadSection.scrollIntoView?.({ behavior: reduced ? "auto" : "smooth", block: "start" });
    downloadSection.querySelector("h2")?.focus?.({ preventScroll: true });
  };

  // Hero
  const hero = section("hero st", "mb-title");
  const brand = el("div", "brand rv");
  const logo = el("img");
  logo.src = LOGO_URL;
  logo.alt = "OpenHands logo";
  brand.append(logo);
  const h1 = heading("h1", "mb-title", "OpenHands in your pocket.", "rv");
  const lede = el("p", "lede muted rv", "A second screen for the OpenHands already running on your laptop. Pair by QR code, then follow your conversations from anywhere.");
  const actions = el("div", "actions rv");
  actions.append(
    actionButton("Download", "download", "download", scrollToDownload),
    actionButton("Pair your phone", "qr", "pair", go(PAIR_ROUTE), false),
  );
  const fine = el("p", "fine muted rv", "Early MVP, version 0.1.0. Not in any app store yet: build it from source.");
  const heroPhone = phone("list", "conversations", { speed: 0.12 });
  heroPhone.classList.add("stagewrap");
  hero.inner.append(brand, el("p", "eyebrow muted rv", "OpenHands Mobile"), h1, lede, actions, fine, heroPhone);

  // Feature sections
  const featureSections = FEATURES.map((f, i) => {
    const { s, inner } = section(`fx st${i % 2 ? " flip" : ""}`, `mb-${f.id}`);
    s.dataset.feature = f.id;
    const copy = el("div", "copy rv");
    const k = el("div", "kicker eyebrow");
    k.append(icon({ pairing: "qr", conversations: "chat", customize: "sliders", automations: "clock" }[f.id]), el("span", "", f.kicker));
    copy.append(k, heading("h2", `mb-${f.id}`, f.title), el("p", "muted", f.body));
    inner.append(copy, phone(f.mock, f.kicker.toLowerCase()));
    return s;
  });

  // Specs strip
  const specs = section("specs-sec hs", "mb-specs");
  const sh = heading("h2", "mb-specs", "The facts.", "rv");
  const sl = el("ul", "specs rv");
  SPECS.forEach((x) => { const li = el("li"); li.append(el("span", "val", x.value), el("span", "muted", x.label)); sl.append(li); });
  specs.inner.append(sh, sl);

  // Pairing steps
  const how = section("block hs", "mb-how");
  const hh = heading("h2", "mb-how", "How pairing works", "rv");
  const ol = el("ol", "steps rv");
  STEPS.forEach((st) => { const li = el("li"); li.append(el("h3", "", st.title), el("p", "muted", st.body)); ol.append(li); });
  how.inner.append(hh, ol);

  // Download
  const dl = section("dl hs", "mb-download-title");
  dl.s.id = "download";
  downloadSection = dl.s;
  const dh = el("div", "head rv");
  const dt = heading("h2", "mb-download-title", "Download");
  dt.tabIndex = -1;
  const dlede = el("p", "lede muted", "No prebuilt app is published yet. Build it from source in about 3 steps.");
  const link = el("a", "btn primary");
  link.href = REPO_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.dataset.action = "repo";
  link.append(icon("download"), el("span", "", "Download from GitHub"));
  const note = el("p", "fine muted");
  note.append("Opens ", el("code", "", REPO_NAME), " on GitHub: the source code. There is no installer, App Store, Google Play or TestFlight build, and no release or tag to download.");
  dh.append(dt, dlede, link, note);
  const cards = el("div", "cards rv");
  INSTALL_BLOCKS.forEach((b, i) => {
    const card = el("article", "card");
    card.dataset.install = b.id;
    card.append(el("div", "num", `Step ${i + 1}`), el("h3", "", b.title), el("p", "muted", b.body), codeBlock("", b.commands, timers));
    if (b.extra) card.append(codeBlock(b.extra.label, b.extra.commands, timers));
    cards.append(card);
  });
  const after = el("p", "fine muted rv", "Then open Settings → Mobile in Agent Canvas and scan the code. Source: README.md, “Sideload on a device”.");
  dl.inner.append(dh, cards, after);

  // Closing call to action
  const cta = section("cta st", "mb-cta");
  const ch = heading("h2", "mb-cta", "Pair your phone.", "rv");
  const cactions = el("div", "actions rv");
  cactions.append(actionButton("Pair your phone", "qr", "pair", go(PAIR_ROUTE)), actionButton("Mobile app setup", "phone", "setup", go(SETUP_ROUTE), false));
  const limits = el("p", "fine muted rv", "The app does not choose a model or store LLM provider keys; the laptop keeps its backend and active LLM. Files, Terminal, Browser and OpenHands Cloud login are not part of it yet. The phone cannot use localhost, so it needs a host it can reach: the laptop’s LAN address, Tailscale, or a tunnel URL.");
  cta.inner.append(ch, cactions, limits);

  root.append(hero.s, ...featureSections, specs.s, how.s, dl.s, cta.s);

  // Motion: reveal on scroll and parallax; everything stays visible without it.
  let io = null;
  let raf = 0;
  const par = [...root.querySelectorAll(".par")];
  function parallax() {
    raf = 0;
    const rr = root.getBoundingClientRect();
    par.forEach((n) => {
      const r = n.getBoundingClientRect();
      const delta = r.top + r.height / 2 - (rr.top + rr.height / 2);
      const y = Math.max(-36, Math.min(36, -delta * Number(n.dataset.par)));
      n.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
  }
  const onScroll = () => { if (!raf && typeof requestAnimationFrame === "function") raf = requestAnimationFrame(parallax); };
  if (!reduced) {
    if (typeof IntersectionObserver === "function") {
      try {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in2"); io?.unobserve(e.target); } });
        }, { root, threshold: 0.1 });
        root.classList.add("js");
        root.querySelectorAll(".rv").forEach((n) => io.observe(n));
      } catch {
        io = null;
        root.classList.remove("js");
      }
    }
    root.addEventListener("scroll", onScroll, { passive: true });
  }

  // Full-height fit.
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (window.innerHeight || 800) - top)}px`;
  }
  const onResize = () => { fit(); if (!reduced) onScroll(); };
  window.addEventListener("resize", onResize);
  let ro = null;
  if (typeof ResizeObserver === "function") {
    ro = new ResizeObserver(() => fit());
    if (container.parentElement) ro.observe(container.parentElement);
  }
  container.replaceChildren(root);
  fit();
  if (!reduced) parallax();
  return () => {
    window.removeEventListener("resize", onResize);
    root.removeEventListener("scroll", onScroll);
    if (raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    io?.disconnect();
    ro?.disconnect();
    container.replaceChildren();
  };
}

export function activate(host) {
  return host.registerPage("mobile", ({ container }) => mountPage(container, host));
}
