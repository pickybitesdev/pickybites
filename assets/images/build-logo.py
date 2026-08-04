"""
PickyBites mark, v2: a map pin with a centred white disc holding a knife and
fork. No bite.

The pin silhouette is emitted as one flat path (boolean union of head circle +
tangent triangle) rather than beziers, so it renders identically in cairosvg,
react-native-svg and browsers.
"""
import math
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union

CX, CY, R = 256.0, 214.0, 140.0
APEX = (256.0, 478.0)
DISC_R = 86.0

d = math.hypot(APEX[0] - CX, APEX[1] - CY)
theta = math.acos(R / d)
ux, uy = (APEX[0] - CX) / d, (APEX[1] - CY) / d


def rot(x, y, a):
    ca, sa = math.cos(a), math.sin(a)
    return x * ca - y * sa, x * sa + y * ca


t1 = (CX + R * rot(ux, uy, theta)[0], CY + R * rot(ux, uy, theta)[1])
t2 = (CX + R * rot(ux, uy, -theta)[0], CY + R * rot(ux, uy, -theta)[1])

pin = unary_union([
    Point(CX, CY).buffer(R, resolution=128),
    Polygon([t1, t2, APEX]),
])


def to_path(poly, precision=2):
    pts = list(poly.exterior.coords)
    out = [f"M{pts[0][0]:.{precision}f},{pts[0][1]:.{precision}f}"]
    for x, y in pts[1:-1]:
        out.append(f"L{x:.{precision}f},{y:.{precision}f}")
    out.append("Z")
    return "".join(out)


PIN_PATH = to_path(pin)

# Cutlery, drawn in the pin colour on the white disc.
# Fork left of centre, knife right, both vertically centred on the disc.
CUTLERY = f"""
  <g fill="{{fill}}">
    <!-- fork: three tines, shoulder, handle -->
    <rect x="218" y="156" width="8" height="40" rx="4"/>
    <rect x="233" y="156" width="8" height="40" rx="4"/>
    <rect x="248" y="156" width="8" height="40" rx="4"/>
    <path d="M217,192 h40 c0,13 -11,15 -13,21 h-14 c-2,-6 -13,-8 -13,-21 Z"/>
    <rect x="232" y="208" width="10" height="64" rx="5"/>

    <!-- knife: straight back edge, curved belly tapering to a tip -->
    <path d="M278,154 c14,18 17,44 15,68 l-15,0 Z"/>
    <rect x="280" y="220" width="10" height="52" rx="5"/>
  </g>
"""

GRADIENT = """
    <linearGradient id="coral" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF9B78"/>
      <stop offset="1" stop-color="#E96F45"/>
    </linearGradient>
"""


def svg(fill="url(#coral)", cutlery_fill="#E96F45", mono=False, bg=None, pad=0.0):
    scale = 1.0 - pad
    off = 256 * pad
    inner = f'<path d="{PIN_PATH}" fill="{fill}"/>'
    if mono:
        # Single-colour variant: disc and cutlery knocked out is not possible in
        # one flat path, so the mono icon is just the silhouette.
        pass
    else:
        inner += f'<circle cx="{CX}" cy="{CY}" r="{DISC_R}" fill="#FFFDFC"/>'
        inner += CUTLERY.format(fill=cutlery_fill)
    body = f'<g transform="translate({off:.1f},{off:.1f}) scale({scale:.3f})">{inner}</g>'
    rect = f'<rect width="512" height="512" fill="{bg}"/>' if bg else ""
    return (
        '<svg width="512" height="512" viewBox="0 0 512 512" '
        f'xmlns="http://www.w3.org/2000/svg"><defs>{GRADIENT}</defs>{rect}{body}</svg>'
    )


if __name__ == "__main__":
    import cairosvg
    open("mark.svg", "w").write(svg())
    cairosvg.svg2png(bytestring=svg().encode(), write_to="preview.png",
                     output_width=512, output_height=512, background_color="#FFFDFC")
    print("v2 rendered")
