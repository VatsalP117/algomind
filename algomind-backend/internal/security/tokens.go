package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
)

const pairingCodeCharset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func RandomToken(byteLength int) (string, error) {
	if byteLength <= 0 {
		return "", fmt.Errorf("byteLength must be positive")
	}

	buffer := make([]byte, byteLength)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func RandomID(prefix string) (string, error) {
	token, err := RandomToken(18)
	if err != nil {
		return "", err
	}

	if prefix == "" {
		return token, nil
	}

	return prefix + "_" + token, nil
}

func RandomPairingCode() (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	var builder strings.Builder
	for i, value := range buffer {
		if i == 4 {
			builder.WriteByte('-')
		}

		builder.WriteByte(pairingCodeCharset[int(value)%len(pairingCodeCharset)])
	}

	return builder.String(), nil
}

func HashToken(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
