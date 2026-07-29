local project = app.params["project"]
if not project or project == "" then
  error("Missing --script-param project=<absolute project path>")
end

local source_dir = app.fs.joinPath(project, "art-source", "aseprite")
local output_dir = app.fs.joinPath(project, "src", "assets", "ui")
app.fs.makeAllDirectories(source_dir)
app.fs.makeAllDirectories(output_dir)

local C = {
  transparent = app.pixelColor.rgba(0, 0, 0, 0),
  ink = app.pixelColor.rgba(13, 15, 14, 255),
  black = app.pixelColor.rgba(7, 9, 8, 255),
  shell = app.pixelColor.rgba(19, 27, 33, 255),
  shell_hi = app.pixelColor.rgba(72, 94, 103, 255),
  wood_dark = app.pixelColor.rgba(39, 27, 26, 255),
  wood = app.pixelColor.rgba(80, 48, 39, 255),
  wood_mid = app.pixelColor.rgba(145, 88, 60, 255),
  wood_hi = app.pixelColor.rgba(201, 136, 78, 255),
  screen = app.pixelColor.rgba(7, 29, 37, 255),
  screen_hi = app.pixelColor.rgba(12, 54, 65, 255),
  felt = app.pixelColor.rgba(15, 91, 91, 255),
  ivory = app.pixelColor.rgba(242, 232, 206, 255),
  cream = app.pixelColor.rgba(209, 209, 190, 255),
  gold = app.pixelColor.rgba(224, 173, 79, 255),
  rust = app.pixelColor.rgba(209, 99, 79, 255),
  red = app.pixelColor.rgba(157, 49, 61, 255),
  blue = app.pixelColor.rgba(31, 102, 139, 255),
  purple = app.pixelColor.rgba(103, 61, 132, 255),
  green = app.pixelColor.rgba(26, 112, 91, 255),
  gray = app.pixelColor.rgba(115, 116, 108, 255),
  gray_hi = app.pixelColor.rgba(174, 172, 151, 255),
  scan = app.pixelColor.rgba(0, 0, 0, 24),
}

local function image(w, h)
  local value = Image(w, h, ColorMode.RGB)
  value:clear(C.transparent)
  return value
end

local function rect(img, x, y, w, h, color)
  if w <= 0 or h <= 0 then return end
  for py = math.max(0, y), math.min(img.height - 1, y + h - 1) do
    for px = math.max(0, x), math.min(img.width - 1, x + w - 1) do
      img:drawPixel(px, py, color)
    end
  end
end

local function outline(img, x, y, w, h, color, thickness)
  local t = thickness or 2
  rect(img, x, y, w, t, color)
  rect(img, x, y + h - t, w, t, color)
  rect(img, x, y, t, h, color)
  rect(img, x + w - t, y, t, h, color)
end

local function line(img, x0, y0, x1, y1, color, thickness)
  local dx, sx = math.abs(x1 - x0), x0 < x1 and 1 or -1
  local dy, sy = -math.abs(y1 - y0), y0 < y1 and 1 or -1
  local err = dx + dy
  local t = thickness or 2
  while true do
    rect(img, x0 - math.floor(t / 2), y0 - math.floor(t / 2), t, t, color)
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err, x0 = err + dy, x0 + sx end
    if e2 <= dx then err, y0 = err + dx, y0 + sy end
  end
end

local function circle(img, cx, cy, radius, color)
  local rr = radius * radius
  for y = -radius, radius do
    for x = -radius, radius do
      if x * x + y * y <= rr then img:drawPixel(cx + x, cy + y, color) end
    end
  end
end

local function diamond(img, cx, cy, radius, color)
  for y = -radius, radius do
    local span = radius - math.abs(y)
    rect(img, cx - span, cy + y, span * 2 + 1, 1, color)
  end
end

local function chamfer_rect(img, x, y, w, h, cut, color)
  local c = math.max(0, math.min(cut or 4, math.floor(math.min(w, h) / 2)))
  rect(img, x + c, y, w - c * 2, h, color)
  rect(img, x, y + c, w, h - c * 2, color)
  for step = 1, c do
    rect(img, x + c - step, y + step - 1, w - (c - step) * 2, 1, color)
    rect(img, x + c - step, y + h - step, w - (c - step) * 2, 1, color)
  end
end

local function ellipse(img, cx, cy, rx, ry, color)
  for y = -ry, ry do
    local ratio = 1 - (y * y) / (ry * ry)
    local span = math.floor(rx * math.sqrt(math.max(0, ratio)))
    rect(img, cx - span, cy + y, span * 2 + 1, 1, color)
  end
end

local function inside_ellipse(x, y, cx, cy, rx, ry)
  local dx, dy = (x - cx) / rx, (y - cy) / ry
  return dx * dx + dy * dy <= 1
end

local function new_sprite(w, h, name)
  local sprite = Sprite(w, h, ColorMode.RGB)
  sprite.filename = app.fs.joinPath(source_dir, name .. ".aseprite")
  sprite.gridBounds = Rectangle(0, 0, 2, 2)
  return sprite
end

local function add_layer(sprite, name, img)
  local layer
  if #sprite.layers == 1 and sprite.layers[1].name == "Layer 1" then
    layer = sprite.layers[1]
    layer.name = name
    layer:cel(1).image = img
  else
    layer = sprite:newLayer()
    layer.name = name
    sprite:newCel(layer, 1, img, Point(0, 0))
  end
end

local function save(sprite, png_name)
  sprite:saveAs(sprite.filename)
  sprite:saveCopyAs(app.fs.joinPath(output_dir, png_name))
  sprite:close()
end

local function make_cabinet()
  local sprite = new_sprite(1280, 720, "cabinet")
  local base = image(1280, 720)
  rect(base, 0, 0, 1280, 720, C.black)
  rect(base, 12, 8, 1256, 704, C.wood_dark)
  rect(base, 20, 14, 1240, 692, C.wood)
  rect(base, 28, 22, 1224, 676, C.shell)
  rect(base, 36, 30, 1208, 660, C.black)
  rect(base, 42, 36, 1196, 648, C.screen)
  add_layer(sprite, "cabinet body", base)

  local trim = image(1280, 720)
  rect(trim, 20, 14, 1240, 4, C.wood_hi)
  rect(trim, 20, 18, 4, 684, C.wood_mid)
  rect(trim, 24, 698, 1232, 4, C.ink)
  rect(trim, 1256, 18, 4, 684, C.ink)
  outline(trim, 36, 30, 1208, 660, C.cream, 2)
  outline(trim, 46, 40, 1188, 640, C.shell_hi, 2)
  for x = 74, 1206, 188 do
    rect(trim, x, 18, 18, 2, C.cream)
    rect(trim, x + 4, 700, 12, 2, C.ink)
  end
  add_layer(sprite, "bezel and fasteners", trim)

  local texture = image(1280, 720)
  for y = 44, 678, 4 do rect(texture, 48, y, 1184, 1, C.scan) end
  for x = 60, 1210, 86 do
    local y = 50 + ((x * 7) % 94)
    rect(texture, x, y, 2, 2, C.screen_hi)
  end
  rect(texture, 54, 48, 112, 4, C.gold)
  rect(texture, 1114, 668, 70, 4, C.rust)
  rect(texture, 592, 696, 96, 8, C.black)
  rect(texture, 608, 698, 64, 3, C.shell_hi)
  add_layer(sprite, "screen texture", texture)
  save(sprite, "video-poker-cabinet.png")
end

local function make_panel()
  local sprite = new_sprite(96, 96, "panel")
  local body = image(96, 96)
  rect(body, 0, 0, 96, 96, C.wood_dark)
  rect(body, 2, 2, 92, 92, C.wood_mid)
  rect(body, 6, 6, 84, 84, C.shell)
  rect(body, 10, 10, 76, 76, C.screen)
  add_layer(sprite, "frame", body)
  local bevel = image(96, 96)
  rect(bevel, 2, 2, 92, 2, C.wood_hi)
  rect(bevel, 2, 2, 2, 92, C.wood_hi)
  rect(bevel, 4, 92, 88, 2, C.ink)
  rect(bevel, 92, 4, 2, 90, C.ink)
  rect(bevel, 10, 10, 76, 2, C.cream)
  rect(bevel, 10, 84, 76, 2, C.black)
  add_layer(sprite, "bevel", bevel)
  local details = image(96, 96)
  for _, point in ipairs({{7,7}, {87,7}, {7,87}, {87,87}}) do
    rect(details, point[1], point[2], 3, 3, C.gold)
    rect(details, point[1] + 1, point[2] + 1, 1, 1, C.ink)
  end
  rect(details, 14, 16, 12, 3, C.green)
  add_layer(sprite, "hardware", details)
  save(sprite, "video-poker-panel.png")
end

local button_tones = {
  { C.green, app.pixelColor.rgba(40, 148, 116, 255) },
  { C.blue, app.pixelColor.rgba(39, 132, 170, 255) },
  { app.pixelColor.rgba(151, 91, 34, 255), app.pixelColor.rgba(201, 126, 42, 255) },
  { C.red, app.pixelColor.rgba(201, 63, 74, 255) },
  { C.purple, app.pixelColor.rgba(137, 82, 169, 255) },
}

local function make_buttons()
  local sprite = new_sprite(288, 240, "button-atlas")
  local body = image(288, 240)
  local highlights = image(288, 240)
  local hardware = image(288, 240)
  for tone_index = 0, 4 do
    for state = 0, 2 do
      local x, y = state * 96, tone_index * 48
      local press = state == 2 and 3 or 0
      local face = state == 1 and button_tones[tone_index + 1][2] or button_tones[tone_index + 1][1]
      chamfer_rect(body, x + 5, y + 8, 88, 38, 5, C.black)
      chamfer_rect(body, x + 1, y + 1 + press, 94, 40, 6, C.shell_hi)
      chamfer_rect(body, x + 3, y + 3 + press, 90, 36, 5, C.ink)
      chamfer_rect(body, x + 6, y + 6 + press, 84, 28, 4, face)
      rect(body, x + 10, y + 34 + press, 76, 4, C.black)
      rect(highlights, x + 10, y + 7 + press, 76, 2, state == 1 and C.ivory or C.cream)
      rect(highlights, x + 8, y + 10 + press, 2, 19, C.ivory)
      rect(highlights, x + 10, y + 30 + press, 76, 2, C.wood_dark)
      rect(hardware, x + 10, y + 13 + press, 4, 4, C.gold)
      rect(hardware, x + 82, y + 13 + press, 4, 4, C.black)
      rect(hardware, x + 11, y + 14 + press, 1, 1, C.ivory)
      if state == 1 then
        rect(hardware, x + 18, y + 40, 60, 2, C.gold)
        rect(hardware, x + 24, y + 42, 48, 1, C.wood_hi)
      end
    end
  end
  add_layer(sprite, "button bodies", body)
  add_layer(sprite, "bevels", highlights)
  add_layer(sprite, "lamps and hardware", hardware)
  save(sprite, "video-poker-buttons.png")
end

local function make_table(name, felt_color, felt_hi)
  local sprite = new_sprite(1120, 510, "table-" .. name)
  local shadow = image(1120, 510)
  ellipse(shadow, 560, 265, 558, 244, app.pixelColor.rgba(0, 0, 0, 190))
  ellipse(shadow, 560, 478, 450, 28, app.pixelColor.rgba(0, 0, 0, 120))
  add_layer(sprite, "shadow", shadow)

  local rail = image(1120, 510)
  ellipse(rail, 560, 252, 556, 244, C.black)
  ellipse(rail, 560, 248, 548, 236, C.wood_dark)
  ellipse(rail, 560, 244, 536, 226, C.wood)
  ellipse(rail, 560, 241, 524, 215, C.wood_mid)
  ellipse(rail, 560, 241, 510, 201, C.gold)
  ellipse(rail, 560, 241, 502, 195, C.wood_dark)
  ellipse(rail, 560, 241, 488, 182, felt_color)
  add_layer(sprite, "padded walnut rail and felt", rail)

  local edging = image(1120, 510)
  for x = 160, 960, 8 do
    local dx = (x - 560) / 520
    local y = 241 - math.floor(214 * math.sqrt(math.max(0, 1 - dx * dx)))
    rect(edging, x, y + 2, 6, 3, (math.floor(x / 8) % 3 == 0) and C.wood_hi or C.wood_mid)
  end
  ellipse(edging, 560, 236, 510, 198, app.pixelColor.rgba(242, 232, 206, 42))
  ellipse(edging, 560, 241, 502, 191, C.wood_dark)
  ellipse(edging, 560, 241, 490, 181, C.cream)
  ellipse(edging, 560, 241, 486, 178, felt_color)
  rect(edging, 488, 47, 144, 8, C.black)
  chamfer_rect(edging, 464, 38, 192, 28, 5, C.wood_dark)
  chamfer_rect(edging, 471, 41, 178, 20, 4, C.screen)
  rect(edging, 493, 47, 134, 3, C.gold)
  add_layer(sprite, "rail highlights", edging)

  local layout = image(1120, 510)
  for y = 104, 404, 52 do
    for x = 126 + ((math.floor(y / 52) % 2) * 34), 994, 68 do
      if inside_ellipse(x, y, 560, 241, 470, 166) then
        diamond(layout, x, y, 3, felt_hi)
        rect(layout, x, y, 1, 1, C.cream)
      end
    end
  end
  line(layout, 428, 253, 692, 253, C.cream, 2)
  diamond(layout, 512, 253, 11, C.gold)
  diamond(layout, 560, 253, 11, C.cream)
  diamond(layout, 608, 253, 11, C.gold)
  line(layout, 316, 400, 804, 400, C.cream, 2)
  add_layer(sprite, "woven felt and table marks", layout)
  save(sprite, "table-" .. name .. ".png")
end

local function draw_rock(img, ox, oy, scale)
  local s = scale or 2
  rect(img, ox + 10*s, oy + 4*s, 16*s, 2*s, C.gray)
  rect(img, ox + 5*s, oy + 6*s, 26*s, 4*s, C.gray)
  rect(img, ox + 2*s, oy + 10*s, 32*s, 13*s, C.gray)
  rect(img, ox + 5*s, oy + 23*s, 27*s, 4*s, C.gray)
  rect(img, ox + 10*s, oy + 27*s, 17*s, 2*s, C.gray)
  rect(img, ox + 9*s, oy + 7*s, 8*s, 4*s, C.gray_hi)
  rect(img, ox + 4*s, oy + 13*s, 8*s, 6*s, C.gray_hi)
  line(img, ox + 17*s, oy + 8*s, ox + 24*s, oy + 22*s, C.ink, s)
  line(img, ox + 7*s, oy + 20*s, ox + 16*s, oy + 24*s, C.ink, s)
end

local function draw_paper(img, ox, oy, scale)
  local s = scale or 2
  rect(img, ox + 4*s, oy + 2*s, 24*s, 30*s, C.ivory)
  rect(img, ox + 28*s, oy + 8*s, 4*s, 24*s, C.cream)
  rect(img, ox + 6*s, oy + 4*s, 18*s, 3*s, app.pixelColor.rgba(248, 236, 202, 255))
  rect(img, ox + 24*s, oy + 2*s, 4*s, 8*s, C.cream)
  line(img, ox + 24*s, oy + 10*s, ox + 30*s, oy + 10*s, C.wood, s)
  for y = 12, 24, 4 do
    line(img, ox + 9*s, oy + y*s, ox + (y == 20 and 25 or 28)*s, oy + y*s, C.blue, s)
  end
end

local function draw_scissors(img, ox, oy, scale)
  local s = scale or 2
  circle(img, ox + 9*s, oy + 25*s, 7*s, C.gray_hi)
  circle(img, ox + 27*s, oy + 25*s, 7*s, C.gray_hi)
  circle(img, ox + 9*s, oy + 25*s, 3*s, C.ink)
  circle(img, ox + 27*s, oy + 25*s, 3*s, C.ink)
  line(img, ox + 13*s, oy + 20*s, ox + 31*s, oy + 2*s, C.ivory, 3*s)
  line(img, ox + 23*s, oy + 20*s, ox + 5*s, oy + 2*s, C.ivory, 3*s)
  line(img, ox + 16*s, oy + 17*s, ox + 20*s, oy + 17*s, C.gold, 2*s)
end

local function make_card(name, face, draw_symbol)
  local sprite = new_sprite(132, 184, "card-" .. name)
  local frame = image(132, 184)
  chamfer_rect(frame, 6, 8, 126, 176, 7, C.black)
  chamfer_rect(frame, 0, 0, 127, 178, 7, C.wood_dark)
  chamfer_rect(frame, 2, 2, 123, 174, 6, C.wood_hi)
  chamfer_rect(frame, 5, 5, 117, 168, 5, C.ivory)
  chamfer_rect(frame, 8, 8, 111, 162, 4, face)
  chamfer_rect(frame, 11, 12, 105, 23, 3, C.ink)
  chamfer_rect(frame, 31, 140, 65, 29, 3, C.wood_dark)
  chamfer_rect(frame, 35, 144, 57, 21, 2, C.ink)
  add_layer(sprite, "card frame", frame)

  local pattern = image(132, 184)
  if name == "rock" then
    for y = 44, 130, 16 do
      for x = 16, 108, 20 do
        line(pattern, x, y, x + 9, y + 8, C.rust, 2)
        line(pattern, x + 9, y + 8, x + 15, y + 1, C.wood_dark, 2)
      end
    end
  elseif name == "paper" then
    for y = 45, 132, 9 do
      line(pattern, 15, y, 111, y, app.pixelColor.rgba(242, 232, 206, 36), 2)
      rect(pattern, 22 + (y % 4) * 9, y + 3, 34, 2, C.screen_hi)
    end
  else
    for y = 48, 128, 22 do
      for x = 22, 104, 28 do
        diamond(pattern, x, y, 7, app.pixelColor.rgba(224, 173, 79, 46))
        diamond(pattern, x, y, 3, C.purple)
      end
    end
  end
  add_layer(sprite, "element pattern", pattern)

  local details = image(132, 184)
  rect(details, 8, 8, 111, 3, C.cream)
  rect(details, 8, 167, 111, 3, C.black)
  rect(details, 15, 39, 97, 3, C.gold)
  rect(details, 38, 145, 51, 2, C.gold)
  rect(details, 12, 157, 7, 4, C.cream)
  rect(details, 108, 18, 5, 5, C.gold)
  diamond(details, 16, 47, 3, C.cream)
  diamond(details, 111, 132, 3, C.gold)
  rect(details, 14, 43, 2, 88, C.wood_dark)
  rect(details, 111, 43, 2, 88, C.cream)
  if name == "rock" then
    rect(details, 18, 126, 9, 2, C.wood_dark)
    rect(details, 99, 52, 5, 3, C.rust)
  elseif name == "paper" then
    rect(details, 19, 56, 2, 15, C.cream)
    rect(details, 96, 126, 11, 2, C.screen_hi)
  else
    rect(details, 20, 119, 7, 2, C.wood_dark)
    diamond(details, 103, 57, 2, C.cream)
  end
  add_layer(sprite, "ink and foil", details)

  local symbol = image(132, 184)
  draw_symbol(symbol, 30, 51, 2)
  add_layer(sprite, "karjitsu symbol", symbol)
  save(sprite, "card-" .. name .. ".png")
end

local function make_card_back()
  local sprite = new_sprite(132, 184, "card-back")
  local frame = image(132, 184)
  chamfer_rect(frame, 6, 8, 126, 176, 7, C.black)
  chamfer_rect(frame, 0, 0, 127, 178, 7, C.wood_dark)
  chamfer_rect(frame, 2, 2, 123, 174, 6, C.wood_hi)
  chamfer_rect(frame, 5, 5, 117, 168, 5, C.ivory)
  outline(frame, 10, 10, 107, 158, C.gold, 2)
  outline(frame, 15, 15, 97, 148, C.cream, 2)
  add_layer(sprite, "collectible frame", frame)
  local pattern = image(132, 184)
  for y = 25, 154, 16 do
    for x = 25 + ((math.floor(y / 16) % 2) * 8), 106, 16 do
      diamond(pattern, x, y, 5, C.gold)
      diamond(pattern, x, y, 2, C.cream)
    end
  end
  diamond(pattern, 64, 88, 28, C.ink)
  diamond(pattern, 64, 88, 21, C.gold)
  diamond(pattern, 64, 88, 13, C.ink)
  diamond(pattern, 64, 88, 6, C.cream)
  add_layer(sprite, "woven back pattern", pattern)
  save(sprite, "card-back.png")
end

local function make_icons()
  local sprite = new_sprite(288, 48, "ui-icons")
  local plates = image(288, 48)
  local symbols = image(288, 48)
  for frame = 0, 5 do
    local x = frame * 48
    rect(plates, x + 2, 2, 44, 44, C.ink)
    rect(plates, x + 4, 4, 40, 40, frame % 2 == 0 and C.screen_hi or C.shell)
    outline(plates, x + 4, 4, 40, 40, C.gold, 2)
  end
  draw_rock(symbols, 5, 8, 1)
  draw_paper(symbols, 53, 6, 1)
  draw_scissors(symbols, 101, 6, 1)
  diamond(symbols, 168, 24, 14, C.gold)
  diamond(symbols, 168, 24, 7, C.screen)
  circle(symbols, 216, 24, 13, C.gold)
  circle(symbols, 216, 24, 8, C.wood)
  rect(symbols, 212, 16, 8, 16, C.ivory)
  line(symbols, 254, 34, 278, 10, C.gray_hi, 5)
  circle(symbols, 258, 34, 6, C.gold)
  circle(symbols, 274, 14, 6, C.gold)
  add_layer(sprite, "icon plates", plates)
  add_layer(sprite, "icon symbols", symbols)
  save(sprite, "video-poker-icons.png")
end

print("Building cabinet")
make_cabinet()
print("Building panel")
make_panel()
print("Building buttons")
make_buttons()
print("Building tables")
make_table("classic", app.pixelColor.rgba(14, 91, 91, 255), app.pixelColor.rgba(27, 119, 116, 255))
make_table("midnight", app.pixelColor.rgba(19, 48, 72, 255), app.pixelColor.rgba(34, 82, 111, 255))
make_table("crimson", app.pixelColor.rgba(98, 36, 46, 255), app.pixelColor.rgba(151, 48, 58, 255))
make_table("violet", app.pixelColor.rgba(65, 42, 82, 255), app.pixelColor.rgba(101, 65, 126, 255))
print("Building cards")
make_card("rock", C.red, draw_rock)
make_card("paper", C.blue, draw_paper)
make_card("scissors", C.purple, draw_scissors)
make_card_back()
print("Building icons")
make_icons()

print("Aseprite sources and PNG exports generated in " .. project)
