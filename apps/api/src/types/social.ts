export interface TwitterApiUser {
  id?: string
  userName?: string
  name?: string
  url?: string
  profilePicture?: string
  verifiedType?: string
  isBlueVerified?: boolean
}

export interface TwitterApiTweet {
  id: string
  url?: string
  text?: string
  createdAt?: string
  lang?: string
  isReply?: boolean
  likeCount?: number
  replyCount?: number
  retweetCount?: number
  quoteCount?: number
  viewCount?: number
  author?: TwitterApiUser
  retweeted_tweet?: {
    id?: string
  } | null
}

export interface TwitterApiTimelineResponse {
  tweets?: TwitterApiTweet[]
  cursor?: string
  has_next_page?: boolean
}

export interface TwitterApiEnvelope {
  status?: string
  code?: number
  msg?: string
  data?: {
    tweets?: TwitterApiTweet[]
    cursor?: string
    has_next_page?: boolean
  }
}
