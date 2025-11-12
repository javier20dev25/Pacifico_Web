import json
s = "A" * 2000000
payload = {"storeData": {"name":"Prueba Grande","slug":"mi-tienda-big","image_base64": s}, "launch": True}
with open("payload_big.json","w") as f:
    f.write(json.dumps(payload))
print("payload_big.json creado con éxito.")
