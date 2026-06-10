from datetime import datetime
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self, user_id: int, type: str, title: str, message: str, link: str | None = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            link=link,
            is_read=False,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_user_notifications(self, user_id: int, limit: int = 50) -> list[Notification]:
        return (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_unread_count(self, user_id: int) -> int:
        return (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

    def mark_as_read(self, user_id: int, notification_id: int) -> Notification | None:
        notification = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.id == notification_id)
            .first()
        )
        if notification:
            notification.is_read = True
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        unread = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .all()
        )
        for n in unread:
            n.is_read = True
        self.db.commit()
        return len(unread)

    def delete_notification(self, user_id: int, notification_id: int) -> bool:
        notification = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.id == notification_id)
            .first()
        )
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False
