import time
from collections import deque
from collections.abc import Callable


class SlidingWindowLimiter:
    """
    Límite de peticiones por cliente en una ventana deslizante, en memoria.
    Basta para una sola instancia (Render gratis); con varias haría falta
    guardarlo en un sitio compartido. `limit` 0 lo desactiva.
    """

    # Tope de clientes recordados, para que la memoria no crezca sin límite
    _MAX_CLIENTS = 10_000

    def __init__(
        self, limit: int, window_s: int, clock: Callable[[], float] = time.monotonic
    ) -> None:
        self.limit = limit
        self.window_s = window_s
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}

    def allow(self, client: str) -> bool:
        if self.limit <= 0:
            return True
        now = self._clock()
        hits = self._hits.get(client)
        if hits is None:
            if len(self._hits) >= self._MAX_CLIENTS:
                self._forget_idle(now)
            hits = self._hits[client] = deque()
        while hits and now - hits[0] >= self.window_s:
            hits.popleft()
        if len(hits) >= self.limit:
            return False
        hits.append(now)
        return True

    def _forget_idle(self, now: float) -> None:
        self._hits = {
            client: hits
            for client, hits in self._hits.items()
            if hits and now - hits[-1] < self.window_s
        }
