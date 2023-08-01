# LinkedIn ICP Canister

![LinkedIn ICP Canister](https://media.licdn.com/dms/image/C5612AQFyojz6Ge5bAg/article-cover_image-shrink_720_1280/0/1647427188118?e=2147483647&v=beta&t=V7Ie14kcpz0MQ2tAxOGwDN1AlLMKSCfQ4boK8SPfOi8) *(Optional: Add a logo or image to represent your project)*

## Overview

LinkedIn ICP Canister is a decentralized Internet Computer (ICP) canister that implements basic LinkedIn-like functionalities, including posting, liking, commenting, and following users. This project demonstrates how to build and deploy a custom canister on the Internet Computer network using Motoko and the `azle` tool.

## Features

- Create, edit, and delete posts
- Like and unlike posts
- Comment on posts
- Follow and unfollow users
- Get posts by user or all posts

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building and Deploying the Canister](#building-and-deploying-the-canister)
- [Interacting with the Canister](#interacting-with-the-canister)
- [Contributions](#contributions)
- [License](#license)

## Prerequisites

- Install DFINITY SDK (dfx) - Make sure you have the DFINITY SDK installed on your system.

## Building and Deploying the Canister

- Clone the repository:

```
git clone https://github.com/SoftCysec/LinkedIn-ICP-Canister.git
cd LinkedIn-ICP-Canister
```

- Install project dependencies:
```
npm install
```

- Build the canister:
```
npx azle linkedIn
```

- Deploy the canister:
```
dfx deploy
```

## Interacting with the Canister

After deploying the canister, you can interact with it using the following commands:
`dfx canister call` or by integrating it into your front-end application.

### Example: Post a new message
```
dfx canister call linkedIn createPost '{
    "content": "Hello World!"
    }'
```
### Example: Get all posts
```
dfx canister call linkedIn getPosts
```

## Contributions
Contributions to the LinkedIn ICP Canister project are welcome! If you find any bugs, have suggestions, or want to add new features, feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License.


