interface APIDataResponse<T> {
    result: T
}

export interface Response<T> {
    config: any
    data: any
    headers: any
    requests: any
    status: number
    statusText: string
}
