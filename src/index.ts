import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type Post = Record<{
  id: string;
  owner: Principal;
  content: string;
  likes: number;
  liked: Vec<string>;
  comments: Vec<Comment>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type Comment = Record<{
  id: string;
  owner: Principal;
  content: string;
  createdAt: nat64;
}>;
type User = Record<{
  id: string;
  owner: Principal;
  followers: Vec<Principal>;
  following: Vec<Principal>;
  posts: Vec<String>;
}>;

type CommentPayload = Record<{
  content: string;
}>;

type PostPayload = Record<{
  content: string;
}>;

const postStorage = new StableBTreeMap<string, Post>(0, 44, 1024);

const userStorage = new StableBTreeMap<string, User>(1, 44, 1024);
// Function to fetch a post
// returns an error message if post with id isn't found
$query;
export function getPost(id: string): Result<Post, string> {
  return match(postStorage.get(id), {
    Some: (post) => Result.Ok<Post, string>(post),
    None: () => Result.Err<Post, string>(`Post with id=${id} not found`),
  });
}

// Function to fetch all posts
$query;
export function getAllPosts(): Result<Vec<Post>, string> {
  return Result.Ok(postStorage.values());
}
$update;
export function register(): User {
  const caller = ic.caller();
  const callerId = caller.toString();

  if (userStorage.get(callerId)) {
    throw new Error("User already exists");
  }

  const user: User = {
    id: callerId,
    owner: caller,
    followers: [],
    following: [],
    posts: [],
  };

  userStorage.insert(callerId, user);
  return user;
}
// Function that allows users to create a post
$update;
export function createPost(payload: PostPayload): Result<Post, string> {
  let userId = ic.caller().toString();
  return match(userStorage.get(userId), {
    Some: (user) => {
      const post: Post = {
        id: uuidv4(),
        owner: ic.caller(),
        content: payload.content,
        likes: 0,
        liked: [],
        comments: [],
        createdAt: ic.time(),
        updatedAt: Opt.None,
      };

      const updateduser: User = {
        ...user,
        posts: [...user.posts, post.id],
      };

      // Update the user in the storage;
      userStorage.insert(user.id, updateduser);
      postStorage.insert(post.id, post);
      return Result.Ok<Post, string>(post);
    },
    None: () => Result.Err<Post, string>(`user with id=${userId} not found`),
  });
}

// Function that allows users to delete their own posts
$update;
export function deletePost(id: string): Result<Post, string> {
  return match(postStorage.get(id), {
    Some: (post) => {
      // if caller isn't the post's owner, return an error
      if (post.owner.toString() !== ic.caller().toString()) {
        return Result.Err<Post, string>("You are not the post's owner");
      }
      postStorage.remove(id);
      return Result.Ok<Post, string>(post);
    },
    None: () => Result.Err<Post, string>(`Post with id=${id} not found`),
  });
}

// Function that allows users to comment on a post
$update;
export function addComment(
  postId: string,
  payload: CommentPayload
): Result<Post, string> {
  return match(postStorage.get(postId), {
    Some: (post) => {
      const comment: Comment = {
        id: uuidv4(),
        owner: ic.caller(),
        content: payload.content,
        createdAt: ic.time(),
      };
      const updatedPost: Post = {
        ...post,
        comments: [...post.comments, comment],
      };
      postStorage.insert(post.id, updatedPost);
      return Result.Ok<Post, string>(updatedPost);
    },
    None: () => Result.Err<Post, string>(`Post with id=${postId} not found`),
  });
}

// Function that allows users to like a post
$update;
export function addLike(postId: string): Result<Post, string> {
  return match(postStorage.get(postId), {
    Some: (post) => {
      let liked: Vec<string> = post.liked;
      // checks if caller has already liked the post
      if (liked.includes(ic.caller().toString())) {
        return Result.Err<Post, string>(`Already liked post with id ${postId}`);
      }
      // add caller to the liked array and increment the likes property by 1
      const updatedPost: Post = {
        ...post,
        likes: post.likes + 1,
        liked: [...liked, ic.caller().toString()],
      };
      postStorage.insert(post.id, updatedPost);
      return Result.Ok<Post, string>(updatedPost);
    },
    None: () => Result.Err<Post, string>(`Post with id=${postId} not found`),
  });
}

// Function that allows users to unlike a post
$update;
export function removeLike(postId: string): Result<Post, string> {
  return match(postStorage.get(postId), {
    Some: (post) => {
      if (post.likes > 0) {
        let liked: Vec<string> = post.liked;
        const likedIndex = liked.findIndex(
          (user) => ic.caller().toString() === user.toString()
        );
        // checks if caller hasn't liked the post
        if (likedIndex === -1) {
          return Result.Err<Post, string>(
            `You haven't liked the post with id ${postId}`
          );
        }
        // removes caller from the liked array
        liked.splice(likedIndex, 1);
        // update the liked array and decrement the likes property by 1
        const updatedPost: Post = {
          ...post,
          likes: post.likes - 1,
          liked: liked,
        };
        postStorage.insert(post.id, updatedPost);
        return Result.Ok<Post, string>(updatedPost);
      } else {
        return Result.Err<Post, string>(
          `Post with id=${postId} has no likes to remove.`
        );
      }
    },
    None: () => Result.Err<Post, string>(`Post with id=${postId} not found`),
  });
}

$update;
export function followUser(userId: string): Result<User, string> {
  if (!userId) {
    return Result.Err<User, string>("userId is empty");
  }

  return match(userStorage.get(userId), {
    Some: (user) => {
      const caller = ic.caller();
      // if caller isn't the tweet's owner, return an error
      if (user.owner.toString() === caller.toString()) {
        return Result.Err<User, string>("You can't follow");
      }

      let updatedFollowers: Vec<Principal>;
      if (!user.followers.includes(caller)) {
        updatedFollowers = [...user.followers, caller];
      } else {
        updatedFollowers = user.followers;
      }

      const updateduser: User = {
        ...user,
        followers: updatedFollowers,
      };

      // Update the user in the storage;
      userStorage.insert(user.id, updateduser);
      followerUpdate(caller.toString(), updateduser.owner);
      return Result.Ok<User, string>(updateduser);
    },
    None: () => Result.Err<User, string>(`user with id=${userId} not found`),
  });
}

function followerUpdate(
  userIdOfFollower: string,
  userIdOfFollowing: Principal
) {
  return match(userStorage.get(userIdOfFollower), {
    Some: (follower) => {
      const followingUp: User = {
        ...follower,
        following: [...follower.following, userIdOfFollowing],
      };

      // Update the user in the storage;
      userStorage.insert(userIdOfFollower, followingUp);

      // return Result.Ok<User, string>(updateduser);
    },
    None: () => `user with id=${userIdOfFollower} not found`,
  });
}

$update;
export function unfollowUser(userId: string): Result<User, string> {
  if (!userId) {
    return Result.Err<User, string>("userId is empty");
  }

  return match(userStorage.get(userId), {
    Some: (user) => {
      const caller = ic.caller();
      // if caller isn't the tweet's owner, return an error
      if (user.owner.toString() === caller.toString()) {
        return Result.Err<User, string>("You can't unfollow yourself.");
      }

      let updatedFollowers: Vec<Principal>;

      updatedFollowers = user.followers.filter(
        (follower) => follower.toString() !== caller.toString()
      );

      const updatedUser: User = {
        ...user,
        followers: updatedFollowers,
      };

      // Update the user in the storage
      userStorage.insert(user.id, updatedUser);
      unfollowUpdate(caller.toString(), updatedUser.owner);
      return Result.Ok<User, string>(updatedUser);
    },
    None: () => Result.Err<User, string>(`User with id=${userId} not found`),
  });
}

function unfollowUpdate(
  userIdOfFollower: string,
  userIdOfFollowing: Principal
) {
  return match(userStorage.get(userIdOfFollower), {
    Some: (follower) => {
      const updatedFollowing: Vec<Principal> = follower.following.filter(
        (following) => following.toString() !== userIdOfFollowing.toString()
      );

      const followingUp: User = {
        ...follower,
        following: updatedFollowing,
      };

      // Update the user in the storage
      userStorage.insert(userIdOfFollower, followingUp);
      return Result.Ok<User, string>(followingUp);
    },
    None: () => `User with id=${userIdOfFollower} not found`,
  });
}

// Function that allows users to get the list of followers for a user
$query;
export function getFollowers(userId: string): Result<Vec<Principal>, string> {
  if (!userId) {
    return Result.Err<Vec<Principal>, string>("userId is empty");
  }

  return match(userStorage.get(userId), {
    Some: (user) => {
      return Result.Ok<Vec<Principal>, string>(user.followers);
    },
    None: () =>
      Result.Err<Vec<Principal>, string>(`User with id=${userId} not found`),
  });
}

// Function that allows users to get the list of users they are following
$query;
export function getFollowing(userId: string): Result<Vec<Principal>, string> {
  if (!userId) {
    return Result.Err<Vec<Principal>, string>("userId is empty");
  }

  return match(userStorage.get(userId), {
    Some: (user) => {
      return Result.Ok<Vec<Principal>, string>(user.following);
    },
    None: () =>
      Result.Err<Vec<Principal>, string>(`User with id=${userId} not found`),
  });
}
// a workaround to make uuid package work with Azle
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

