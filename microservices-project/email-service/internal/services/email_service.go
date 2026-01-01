package services

import (
	"github.com/SneaX-23/Microservices-project/microservices-project/email-service/internal/templates"
)

func (s *EmailService) SendEmail(username, email string) error {
	body, err := s.renderer.Render(
		"new_user.html",
		templates.NewUserData{
			Username: username,
			LoginURL: s.config.LoginURL,
		},
	)
	if err != nil {
		return err
	}

	return s.mailer.Send(email, "Welcome to Our Platform", body)
}
