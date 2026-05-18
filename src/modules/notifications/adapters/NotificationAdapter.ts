export interface NotificationUiModel {
  title: string
  body: string
  url?: string
}

export const NotificationAdapter = {
  toUiModel(title: string, body: string, url: string = '/'): NotificationUiModel {
    return { title, body, url }
  }
}
