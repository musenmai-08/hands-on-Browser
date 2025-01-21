https://speakerdeck.com/recruitengineers/browser-9b5a2b70-4b6a-4108-a1f5-0876a3ceb8d0?slide=192
これをやってみた記録

# https に変更

## 証明書の発行

https://chatgpt.com/share/678e59cc-1fe8-8013-a6e4-4f762228cbdf

ローカル CA（認証局）を作成。CA 証明書(.crt)と CA 秘密鍵(.pem)が作られる

この CA が保証する証明書を発行する。

```bash
npm exec mkcert create-ca
# 実行結果
# CA Private Key: ca.key
# CA Certificate: ca.crt
```

証明書はできたが、まだシステムの信頼ストアには入っていない。

`./ca.crt`証明書ファイルをシステム全体で信頼するルート証明書として`System.keychain`に追加する。

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./ca.crt
```

CA が信頼されたので、証明書を発行する

```bash
npm exec mkcert create-cert
# 実行結果
# Private Key: cert.key
# Certificate: cert.crt
```

## サーバーに証明書を設定

`createServer`を修正して`key`と`cert`を渡す。

- curl でアクセスしてみた
  curl -i -vvv https://localhost:3000/login
  (出力結果は省略)

# http2 に変更

createServer を使っていた部分を createSecureServer に置き換える
