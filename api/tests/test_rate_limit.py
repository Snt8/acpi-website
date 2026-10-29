from acpi_api.http.rate_limit import SlidingWindowLimiter


class FakeClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_deja_pasar_hasta_el_limite_y_libera_al_correr_la_ventana():
    clock = FakeClock()
    limiter = SlidingWindowLimiter(2, window_s=60, clock=clock)

    assert [limiter.allow("a") for _ in range(3)] == [True, True, False]
    assert limiter.allow("b")
    clock.now = 60
    assert limiter.allow("a")


def test_con_limite_cero_no_limita():
    limiter = SlidingWindowLimiter(0, window_s=60)
    assert all(limiter.allow("a") for _ in range(100))
