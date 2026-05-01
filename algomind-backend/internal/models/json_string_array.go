package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type JSONStringArray []string

func (a *JSONStringArray) Scan(src interface{}) error {
	switch value := src.(type) {
	case nil:
		*a = JSONStringArray{}
		return nil
	case []byte:
		return json.Unmarshal(value, a)
	case string:
		return json.Unmarshal([]byte(value), a)
	default:
		return fmt.Errorf("unsupported JSONStringArray source type %T", src)
	}
}

func (a JSONStringArray) Value() (driver.Value, error) {
	if a == nil {
		return []byte("[]"), nil
	}

	return json.Marshal([]string(a))
}
