using Microsoft.AspNetCore.Mvc;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace BILLMATRIX1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _service;
        private readonly IConfiguration _config;

        public AuthController(IUserService service, IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        [HttpGet("validate")]
        public IActionResult Validate() => Ok(new { valid = true });

        // ✅ Receives AddUserRequest DTO, not raw User entity
        [HttpPost("register")]
        public IActionResult Register([FromBody] AddUserRequest request)
        {
            _service.Register(request);
            return Ok("User Registered");
        }

        // ✅ Returns only safe fields via DTO, not raw User entity
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _service.Login(req.EmailOrPhone, req.Password);
            if (user == null) return Unauthorized("Invalid credentials");

            var token = GenerateJwtToken(user);

            // ✅ Never return raw entity — return only what frontend needs
            return Ok(new
            {
                token,
                userId = user.UserId,
                role = user.Role,
                email = user.Email
            });
        }

        [HttpGet("detect-role")]
        public IActionResult DetectRole([FromQuery] string emailOrPhone)
        {
            var user = _service.GetUserByEmailOrPhone(emailOrPhone);
            if (user == null) return NotFound("User not found");
            return Ok(new { role = user.Role, userId = user.UserId });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(Convert.ToDouble(jwtSettings["ExpireMinutes"])),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}