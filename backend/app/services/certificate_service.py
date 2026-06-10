from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from datetime import datetime
from io import BytesIO

class CertificateService:
    def generate_certificate(self, user, course):
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)
        
        # Background gradient effect
        c.setFillColor(HexColor('#f8fafc'))
        c.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Border
        c.setStrokeColor(HexColor('#667eea'))
        c.setLineWidth(8)
        c.rect(30, 30, width-60, height-60, fill=False)
        c.setStrokeColor(HexColor('#764ba2'))
        c.setLineWidth(3)
        c.rect(50, 50, width-100, height-100, fill=False)
        
        # Header
        c.setFillColor(HexColor('#667eea'))
        c.setFont("Helvetica-Bold", 48)
        c.drawCentredString(width/2, height-130, "CERTIFICATE")
        
        c.setFont("Helvetica", 24)
        c.drawCentredString(width/2, height-170, "OF COMPLETION")
        
        # "This is to certify that"
        c.setFillColor(HexColor('#666666'))
        c.setFont("Helvetica-Oblique", 18)
        c.drawCentredString(width/2, height-230, "This is to certify that")
        
        # User name
        c.setFillColor(HexColor('#2d3748'))
        c.setFont("Helvetica-Bold", 36)
        c.drawCentredString(width/2, height-290, user.full_name or user.username)
        
        # Has completed
        c.setFillColor(HexColor('#666666'))
        c.setFont("Helvetica", 18)
        c.drawCentredString(width/2, height-330, "has successfully completed the course")
        
        # Course name
        c.setFillColor(HexColor('#667eea'))
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(width/2, height-380, course.title)
        
        # Course details
        c.setFillColor(HexColor('#666666'))
        c.setFont("Helvetica", 14)
        c.drawCentredString(width/2, height-420, 
            f"Category: {course.category} | Level: {course.level} | Duration: {course.duration_hours} hours")
        
        # Date
        date_str = datetime.now().strftime("%B %d, %Y")
        c.setFont("Helvetica", 14)
        c.drawCentredString(width/2, height-470, f"Issued on {date_str}")
        
        # Instructor
        c.setFont("Helvetica", 14)
        c.drawCentredString(width/2, height-500, f"Instructor: {course.instructor or 'Expert Instructor'}")
        
        # Footer
        c.setFillColor(HexColor('#667eea'))
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(width/2, 80, "CourseRec AI")
        c.setFont("Helvetica", 10)
        c.setFillColor(HexColor('#999999'))
        c.drawCentredString(width/2, 60, "AI-Powered Course Recommendation Platform")
        
        c.save()
        buffer.seek(0)
        return buffer
